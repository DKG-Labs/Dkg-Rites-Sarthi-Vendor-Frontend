import axios from 'axios';
/**
 * Global HTTP Fetch, XMLHttpRequest and Axios Authorization Interceptor
 * Automatically attaches Authorization: Bearer <token> to all API calls targeting the Sarthi backend.
 */

const isInvalidAuth = (val) => {
    if (!val) return true;
    const v = String(val).trim().toLowerCase();
    return v === '' || v === 'bearer' || v === 'bearer null' || v === 'bearer undefined' || v === 'null' || v === 'undefined';
};

const getToken = () => {
    // 1. If URL search parameters contain a fresh token passed from iframe parent, prioritize & persist it
    if (typeof window !== 'undefined' && window.location && window.location.search) {
        try {
            const params = new URLSearchParams(window.location.search);
            const urlToken = params.get('token') || params.get('authToken');
            if (urlToken && !isInvalidAuth(urlToken)) {
                const clean = String(urlToken).replace(/^Bearer\s+/i, '').trim();
                localStorage.setItem('sleeper_token', clean);
                localStorage.setItem('railpad_token', clean);
                localStorage.setItem('authToken', clean);
                localStorage.setItem('token', clean);
                sessionStorage.setItem('token', clean);
                sessionStorage.setItem('authToken', clean);
                return clean;
            }
        } catch (e) {}
    }

    // 2. Otherwise read from storage across all standard keys, filtering invalid strings
    const candidates = [
        localStorage.getItem('authToken'),
        localStorage.getItem('token'),
        localStorage.getItem('railpad_token'),
        localStorage.getItem('sleeper_token'),
        sessionStorage.getItem('authToken'),
        sessionStorage.getItem('token')
    ];

    for (const c of candidates) {
        if (c && !isInvalidAuth(c)) {
            return String(c).replace(/^Bearer\s+/i, '').trim();
        }
    }

    return '';
};

let isSessionExpiring = false;
export const notifySessionExpired = (url = '') => {
    if (isSessionExpiring) return;
    
    // Ignore public auth requests, third-party CRIS/IMMS endpoints, and static assets
    const urlLower = (typeof url === 'string' ? url : '').toLowerCase();
    const isPublicAuth =
        urlLower.includes('/loginbasedontype') ||
        urlLower.includes('/login') ||
        urlLower.includes('/verifyotp') ||
        urlLower.includes('/forgot-password') ||
        urlLower.includes('/public/') ||
        urlLower.includes('/vendorsync/authenticate') ||
        urlLower.includes('/immsapi/') ||
        urlLower.includes('/version.json');
    if (isPublicAuth) return;

    isSessionExpiring = true;
    setTimeout(() => { isSessionExpiring = false; }, 5000);

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sarthi:session_expired', {
            detail: { message: 'Authentication token expired or invalid (401)' }
        }));
        if (window.parent && window.parent !== window) {
            try {
                window.parent.postMessage({ type: 'sarthi:session_expired' }, '*');
            } catch (e) {}
        }
    }
};

export const setupAuthInterceptor = () => {
    // 1. Safe Axios interceptor
    const applyAxiosInterceptor = (axiosInstance) => {
        if (axiosInstance && axiosInstance.interceptors && !axiosInstance.__sarthiAuthInterceptorInstalled) {
            axiosInstance.__sarthiAuthInterceptorInstalled = true;
            axiosInstance.interceptors.request.use((config) => {
                const token = getToken();
                if (token) {
                    config.headers = config.headers || {};
                    const existingAuth = config.headers.Authorization || config.headers.authorization;
                    if (isInvalidAuth(existingAuth)) {
                        if (typeof config.headers.set === 'function') {
                            config.headers.set('Authorization', `Bearer ${token}`);
                        } else {
                            config.headers['Authorization'] = `Bearer ${token}`;
                        }
                    }
                }
                return config;
            }, (error) => Promise.reject(error));

            if (!axiosInstance.__sarthiAuthResponseInterceptorInstalled) {
                axiosInstance.__sarthiAuthResponseInterceptorInstalled = true;
                axiosInstance.interceptors.response.use(
                    (response) => response,
                    (error) => {
                        const status = error?.response?.status;
                        const url = error?.config?.url || '';
                        if (status === 401) {
                            notifySessionExpired(url);
                        }
                        return Promise.reject(error);
                    }
                );
            }
        }
    };

    if (axios) {
        applyAxiosInterceptor(axios);
    }
    if (typeof window !== 'undefined' && window.axios) {
        applyAxiosInterceptor(window.axios);
    }
    try {
        const axiosLib = require('axios');
        if (axiosLib) applyAxiosInterceptor(axiosLib.default || axiosLib);
    } catch (e) {}

    // 2. XMLHttpRequest Interceptor
    if (typeof window !== 'undefined' && window.XMLHttpRequest && !window.__sarthiXhrInterceptorInstalled) {
        window.__sarthiXhrInterceptorInstalled = true;
        const originalOpen = window.XMLHttpRequest.prototype.open;
        const originalSetRequestHeader = window.XMLHttpRequest.prototype.setRequestHeader;
        const originalSend = window.XMLHttpRequest.prototype.send;

        window.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            this.__sarthiRequestUrl = typeof url === 'string' ? url : '';
            this.__sarthiHasAuthHeader = false;
            return originalOpen.apply(this, [method, url, ...rest]);
        };

        window.XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
            if (name && name.toLowerCase() === 'authorization') {
                this.__sarthiHasAuthHeader = true;
                if (isInvalidAuth(value)) {
                    const token = getToken();
                    if (token) value = `Bearer ${token}`;
                }
            }
            return originalSetRequestHeader.apply(this, [name, value]);
        };

        window.XMLHttpRequest.prototype.send = function (...args) {
            const url = this.__sarthiRequestUrl || '';
            const isPublicAuth =
                url.includes('/loginBasedOnType') ||
                url.includes('/login') ||
                url.includes('/verifyOtp') ||
                url.includes('/forgot-password');

            if (!isPublicAuth && !this.__sarthiHasAuthHeader) {
                const token = getToken();
                if (token) {
                    try {
                        originalSetRequestHeader.apply(this, ['Authorization', `Bearer ${token}`]);
                    } catch (e) {}
                }
            }

            this.addEventListener('load', function () {
                if (this.status === 401) {
                    notifySessionExpired(url);
                }
            });

            return originalSend.apply(this, args);
        };
    }

    // 3. Window.fetch Interceptor
    if (typeof window === 'undefined' || window.__sarthiAuthInterceptorInstalled) {
        return;
    }
    window.__sarthiAuthInterceptorInstalled = true;

    const originalFetch = window.fetch;

    window.fetch = async function (input, init = {}) {
        let url = '';
        if (typeof input === 'string') {
            url = input;
        } else if (input instanceof URL) {
            url = input.href;
        } else if (input && typeof input.url === 'string') {
            url = input.url;
        }

        const isPublicAuth =
            url.includes('/loginBasedOnType') ||
            url.includes('/login') ||
            url.includes('/verifyOtp') ||
            url.includes('/forgot-password');

        if (!isPublicAuth) {
            const token = getToken();
            if (token) {
                try {
                    if (input instanceof Request) {
                        try {
                            const existingAuth = input.headers.get('Authorization') || input.headers.get('authorization');
                            if (isInvalidAuth(existingAuth)) {
                                input.headers.set('Authorization', `Bearer ${token}`);
                            }
                        } catch (e) {}
                    } else {
                        const options = { ...init };
                        if (!options.headers) {
                            options.headers = { 'Authorization': `Bearer ${token}` };
                        } else if (options.headers instanceof Headers) {
                            const existingAuth = options.headers.get('Authorization') || options.headers.get('authorization');
                            if (isInvalidAuth(existingAuth)) {
                                options.headers.set('Authorization', `Bearer ${token}`);
                            }
                        } else if (Array.isArray(options.headers)) {
                            const authIdx = options.headers.findIndex(([k]) => k.toLowerCase() === 'authorization');
                            if (authIdx === -1 || isInvalidAuth(options.headers[authIdx][1])) {
                                if (authIdx !== -1) options.headers.splice(authIdx, 1);
                                options.headers.push(['Authorization', `Bearer ${token}`]);
                            }
                        } else if (typeof options.headers === 'object') {
                            const authKey = Object.keys(options.headers).find(k => k.toLowerCase() === 'authorization');
                            if (!authKey || isInvalidAuth(options.headers[authKey])) {
                                options.headers['Authorization'] = `Bearer ${token}`;
                            }
                        }
                        init = options;
                    }
                } catch (err) {
                    console.warn('[AuthInterceptor] Error attaching token to request:', err);
                }
            }
        }

        try {
            const response = await originalFetch.apply(this, [input, init]);
            if (response && response.status === 401) {
                notifySessionExpired(url);
            }
            return response;
        } catch (fetchErr) {
            throw fetchErr;
        }
    };
};

setupAuthInterceptor();

/**
 * Global HTTP Fetch, XMLHttpRequest and Axios Authorization Interceptor
 * Automatically attaches Authorization: Bearer <token> to all API calls targeting the Sarthi backend.
 */
const getToken = () => {
    // 1. If URL search parameters contain a fresh token passed from iframe parent, prioritize & persist it
    if (typeof window !== 'undefined' && window.location && window.location.search) {
        try {
            const params = new URLSearchParams(window.location.search);
            const urlToken = params.get('token') || params.get('authToken');
            if (urlToken) {
                localStorage.setItem('sleeper_token', urlToken);
                localStorage.setItem('authToken', urlToken);
                localStorage.setItem('token', urlToken);
                sessionStorage.setItem('token', urlToken);
                sessionStorage.setItem('authToken', urlToken);
                return urlToken;
            }
        } catch (e) {}
    }

    // 2. Otherwise read from storage
    return (
        localStorage.getItem('sleeper_token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('railpad_token') ||
        sessionStorage.getItem('authToken') ||
        sessionStorage.getItem('token') ||
        ''
    );
};

let isSessionExpiring = false;
const notifySessionExpired = (url = '') => {
    if (isSessionExpiring) return;
    
    // Ignore public auth requests, third-party CRIS/IMMS endpoints, and static assets
    const urlLower = (typeof url === 'string' ? url : '').toLowerCase();
    const isPublicAuth =
        urlLower.includes('/loginbasedontype') ||
        urlLower.includes('/login') ||
        urlLower.includes('/verifyotp') ||
        urlLower.includes('/forgot-password') ||
        urlLower.includes('/auth/') ||
        urlLower.includes('/public/') ||
        urlLower.includes('/vendorsync/authenticate') ||
        urlLower.includes('/immsapi/') ||
        urlLower.includes('/version.json');
    if (isPublicAuth) return;

    const token = getToken();
    if (!token) return;

    isSessionExpiring = true;
    setTimeout(() => { isSessionExpiring = false; }, 5000);

    window.dispatchEvent(new CustomEvent('sarthi:session_expired', {
        detail: { message: 'Authentication token expired or invalid (401)' }
    }));
};

export const setupAuthInterceptor = () => {
    // 1. Safe Axios interceptor
    if (typeof window !== 'undefined' && window.axios && window.axios.interceptors) {
        const axiosInstance = window.axios;
        if (!axiosInstance.__sarthiAuthInterceptorInstalled && axiosInstance.interceptors.request) {
            axiosInstance.__sarthiAuthInterceptorInstalled = true;
            axiosInstance.interceptors.request.use((config) => {
                const token = getToken();
                if (token) {
                    config.headers = config.headers || {};
                    if (!config.headers.Authorization && !config.headers.authorization) {
                        if (typeof config.headers.set === 'function') {
                            config.headers.set('Authorization', `Bearer ${token}`);
                        } else {
                            config.headers['Authorization'] = `Bearer ${token}`;
                        }
                    }
                }
                return config;
            }, (error) => Promise.reject(error));
        }

        if (!axiosInstance.__sarthiAuthResponseInterceptorInstalled && axiosInstance.interceptors.response) {
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

    // 2. XMLHttpRequest Interceptor
    if (typeof window !== 'undefined' && window.XMLHttpRequest && !window.__sarthiXhrInterceptorInstalled) {
        window.__sarthiXhrInterceptorInstalled = true;
        const originalOpen = window.XMLHttpRequest.prototype.open;
        const originalSend = window.XMLHttpRequest.prototype.send;

        window.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            this.__sarthiRequestUrl = typeof url === 'string' ? url : '';
            return originalOpen.apply(this, [method, url, ...rest]);
        };

        window.XMLHttpRequest.prototype.send = function (...args) {
            const url = this.__sarthiRequestUrl || '';
            const isPublicAuth =
                url.includes('/loginBasedOnType') ||
                url.includes('/login') ||
                url.includes('/verifyOtp') ||
                url.includes('/forgot-password');

            if (!isPublicAuth) {
                const token = getToken();
                if (token) {
                    try {
                        this.setRequestHeader('Authorization', `Bearer ${token}`);
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
                            if (!input.headers.has('Authorization') && !input.headers.has('authorization')) {
                                input.headers.set('Authorization', `Bearer ${token}`);
                            }
                        } catch (e) {}
                    } else {
                        const options = { ...init };
                        if (!options.headers) {
                            options.headers = { 'Authorization': `Bearer ${token}` };
                        } else if (options.headers instanceof Headers) {
                            if (!options.headers.has('Authorization') && !options.headers.has('authorization')) {
                                options.headers.set('Authorization', `Bearer ${token}`);
                            }
                        } else if (Array.isArray(options.headers)) {
                            const hasAuth = options.headers.some(([k]) => k.toLowerCase() === 'authorization');
                            if (!hasAuth) {
                                options.headers.push(['Authorization', `Bearer ${token}`]);
                            }
                        } else if (typeof options.headers === 'object') {
                            const hasAuth = Object.keys(options.headers).some(k => k.toLowerCase() === 'authorization');
                            if (!hasAuth) {
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

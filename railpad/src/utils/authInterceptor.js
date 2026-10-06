import axios from 'axios';

/**
 * Global HTTP Fetch and Axios Authorization Interceptor
 * Automatically attaches Authorization: Bearer <token> to all API calls targeting the Sarthi backend,
 * ensuring seamless authentication across all components and services after VAPT backend hardening.
 */
export const setupAuthInterceptor = () => {
    // 1. Axios Interceptor
    if (axios && axios.interceptors && axios.interceptors.request) {
        if (!axios.__sarthiAuthInterceptorInstalled) {
            axios.__sarthiAuthInterceptorInstalled = true;
            axios.interceptors.request.use((config) => {
                const token =
                    localStorage.getItem('railpad_token') ||
                    localStorage.getItem('authToken') ||
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('token') ||
                    sessionStorage.getItem('authToken');

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
    }

    // 2. Window.fetch Interceptor
    if (typeof window === 'undefined' || window.__sarthiAuthInterceptorInstalled) {
        return;
    }
    window.__sarthiAuthInterceptorInstalled = true;

    const originalFetch = window.fetch;

    window.fetch = async function (input, init = {}) {
        try {
            // Determine the request URL
            let url = '';
            if (typeof input === 'string') {
                url = input;
            } else if (input instanceof URL) {
                url = input.href;
            } else if (input && typeof input.url === 'string') {
                url = input.url;
            }

            // Check if this is a request to the Sarthi backend
            const isBackendCall =
                url.includes('/sarthi-backend/') ||
                url.includes('/api/') ||
                url.includes(':8080') ||
                url.includes('ritesqasarthi.com') ||
                url.includes('azurewebsites.net');

            // Exclude public authentication endpoints that don't need tokens
            const isPublicAuth =
                url.includes('/api/auth/login') ||
                url.includes('/api/auth/verifyOtp') ||
                url.includes('/api/auth/forgot-password');

            if (isBackendCall && !isPublicAuth) {
                const token =
                    localStorage.getItem('railpad_token') ||
                    localStorage.getItem('authToken') ||
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('token') ||
                    sessionStorage.getItem('authToken');

                if (token) {
                    if (input instanceof Request) {
                        try {
                            if (!input.headers.has('Authorization') && !input.headers.has('authorization')) {
                                input.headers.set('Authorization', `Bearer ${token}`);
                            }
                        } catch (e) {
                            // If headers are immutable, fallback
                        }
                        return originalFetch.call(this, input, init);
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
                        return originalFetch.call(this, input, options);
                    }
                }
            }
        } catch (err) {
            console.warn('[AuthInterceptor] Error attaching token to request:', err);
        }

        return originalFetch.apply(this, arguments);
    };
};

// Immediately invoke when imported
setupAuthInterceptor();

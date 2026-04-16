const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Consolidated Proxy for all IMMS API requests
  // This approach is more robust for preserving the /immsapi path prefix
  app.use(
    '/immsapi',
    createProxyMiddleware({
      target: 'https://ireps.gov.in',
      changeOrigin: true,
      secure: false,
      pathRewrite: (path) => `/immsapi${path}`,
      onProxyReq: (proxyReq, req, res) => {
        // Remove headers that cause 417 Expectation Failed on some CRIS servers
        proxyReq.removeHeader('Expect');
        proxyReq.setHeader('User-Agent', 'PostmanRuntime/7.43.0');
        
        console.log(`[IMMS Proxy] ${req.method} ${req.originalUrl} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
      }
    })
  );
};

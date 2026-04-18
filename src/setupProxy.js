const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Match the production Azure path /api/immsapi
  app.use(
    createProxyMiddleware({
      pathFilter: '/api/immsapi',
      target: 'https://ireps.gov.in',
      changeOrigin: true,
      secure: false,
      onProxyReq: (proxyReq, req, res) => {
        // Remove headers that cause 417 Expectation Failed on some CRIS servers
        proxyReq.removeHeader('Expect');
        proxyReq.setHeader('User-Agent', 'PostmanRuntime/7.43.0');
        
        // Final log to verify the exact outcome
        // Note: The outgoing path to IREPS should not have the /api prefix
        const targetPath = proxyReq.path.replace('/api', '');
        console.log(`[IMMS Proxy] ${req.method} ${req.originalUrl} -> https://ireps.gov.in${targetPath}`);
      }
    })
  );
};

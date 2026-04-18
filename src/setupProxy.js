const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Robust Proxy for IMMS - Handles the /immsapi prefix explicitly
  app.use(
    createProxyMiddleware({
      pathFilter: '/immsapi',
      target: 'https://ireps.gov.in',
      changeOrigin: true,
      secure: false,
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.removeHeader('Expect');
        proxyReq.setHeader('User-Agent', 'PostmanRuntime/7.43.0');
        
        // Final log to verify the exact outcome
        console.log(`[IMMS Proxy] ${req.method} ${req.originalUrl} -> https://ireps.gov.in${proxyReq.path}`);
      }
    })
  );
};

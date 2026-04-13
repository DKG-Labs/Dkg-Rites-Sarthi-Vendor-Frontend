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
      // Route to different targets based on the specific API endpoint
      router: (req) => {
        if (req.url.includes('/purchase')) {
          return 'https://trial.ireps.gov.in';
        }
        return 'https://ireps.gov.in';
      },
      // Explicitly preserve the /immsapi prefix when forwarding to targets
      pathRewrite: (path, req) => {
        return '/immsapi' + path;
      },
      onProxyReq: (proxyReq, req, res) => {
        // Use standardized headers for CRIS/IREPS portal compatibility
        proxyReq.setHeader('User-Agent', 'PostmanRuntime/7.43.0');
        proxyReq.removeHeader('Expect'); 
        
        // Log the proxy action to the terminal for debugging
        console.log(`[IMMS Proxy] ${req.method} ${req.originalUrl} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
      }
    })
  );
};

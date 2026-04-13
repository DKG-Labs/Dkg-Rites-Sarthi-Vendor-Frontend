import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/sleeper-vendor/',
  server: {
    proxy: {
      '/immsapi/authenticate': {
        target: 'https://ireps.gov.in',
        changeOrigin: true,
        secure: false,
        headers: {
          'User-Agent': 'PostmanRuntime/7.43.0'
        }
      },
      '/immsapi/purchase': {
        target: 'https://trial.ireps.gov.in',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Some CRIS servers fail with 417 if Expect header is present
            proxyReq.removeHeader('Expect');
            proxyReq.setHeader('User-Agent', 'PostmanRuntime/7.43.0');
          });
        }
      }
    }
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
})

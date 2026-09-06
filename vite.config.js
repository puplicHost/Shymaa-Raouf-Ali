import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// NOTE: This dev-server proxy is a DEVELOPMENT-ONLY solution. The Nara API key
// (loaded from a NON-VITE_ env var: BYNARA_API_KEY) is injected server-side by
// this proxy and NEVER shipped to the browser bundle.
//
// In production the same `/api/nara/*` path is served by a Cloudflare Pages
// Function (see functions/api/nara/[[path]].js) which reads BYNARA_API_KEY
// from the project's server-side secrets.

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const naraKey = env.BYNARA_API_KEY || ''

  return {
    plugins: [vue()],
    server: {
      proxy: {
        '/api/nara': {
          target: 'https://router.bynara.id',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/nara/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (naraKey) {
                proxyReq.setHeader('Authorization', `Bearer ${naraKey}`)
              }
            })
          },
        },
      },
    },
  }
})
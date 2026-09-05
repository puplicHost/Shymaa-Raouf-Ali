import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// NOTE: This dev-server proxy is a DEVELOPMENT-ONLY solution. The Nara API key
// (loaded from a NON-VITE_ env var: BYNARA_API_KEY) is injected server-side by
// this proxy and NEVER shipped to the browser bundle.
//
// In production there is no proxy/backend, so the AI fallback is simply
// disabled and the assistant runs 100% locally.

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
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/nara': {
        target: 'https://router.bynara.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nara/, '')
      }
    }
  }
})

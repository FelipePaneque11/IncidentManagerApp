import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Enable React support in Vite.
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,

    proxy: {
      '/api': {
        // Forward API requests to our separately running FastAPI server.
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,

        // FastAPI's routes do not include the frontend's /api prefix.
        rewrite(path: string) {
          return path.replace(/^\/api/, '')
        },
      },
    },
  },
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',   // bind to all interfaces → accessible from LAN/external browser
    port: 5173,
    strictPort: true,
    proxy: {
      // Every request to /api/* gets forwarded to the Express backend.
      // This means frontend code only ever calls /api/... (no hardcoded IP/port),
      // so it works from any device that can reach this Vite server.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})

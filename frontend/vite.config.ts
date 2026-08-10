import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',   // bind to all network interfaces → accessible from LAN/external browser
    port: 5173,         // explicit port so it's predictable
    strictPort: true,   // fail clearly if port is taken instead of silently picking another
  },
  preview: {
    host: '0.0.0.0',   // same for `vite preview` (production build preview)
    port: 4173,
  },
})

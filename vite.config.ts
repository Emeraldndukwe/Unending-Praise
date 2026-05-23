import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// macOS AirPlay uses 5000; API runs on 5001 in dev (see package.json dev:server)
const API_PORT = process.env.VITE_API_PORT || '5001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    // Avoid Safari warning when preloaded chunk is not used immediately
    modulePreload: false,
  },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

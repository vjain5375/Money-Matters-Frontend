import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,         // auto-opens browser on npm run dev
    strictPort: false,  // fallback to next port if 3000 is taken
  },
})

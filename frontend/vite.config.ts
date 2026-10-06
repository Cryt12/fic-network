import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The Laravel API (php artisan serve). Proxying it keeps the SPA and API on one
// origin in dev, so Sanctum's session + XSRF cookies just work and CORS never kicks in.
const backend = 'http://localhost:8111'
const proxied = { target: backend, xfwd: true }
const proxy = { '/api': proxied, '/sanctum': proxied, '/storage': proxied }

// Public hostname served through the Cloudflare Tunnel (Vite rejects unknown hosts otherwise).
const allowedHosts = ['phficnetwork.dostcaraga.ph']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: { port: 5111, strictPort: true, allowedHosts, proxy },
  // `npm run preview` serves the production build (npm run build) on the same port.
  preview: { port: 5111, strictPort: true, allowedHosts, proxy },
})

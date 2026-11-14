import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg', 'favicon.svg'],
      manifest: {
        name: 'Quiz Party — Live Multiplayer Quizzes',
        short_name: 'Quiz Party',
        description:
          'Create original quizzes and play them live with friends on any device. Free, no accounts, peer-to-peer.',
        theme_color: '#0d1526',
        background_color: '#0d1526',
        display: 'standalone',
        start_url: '/',
        categories: ['games', 'education'],
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
      },
    }),
  ],
})

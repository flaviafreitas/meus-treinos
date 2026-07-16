import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// O site vai ficar em https://<usuario>.github.io/meus-treinos/
// por isso o base precisa ser '/meus-treinos/'.
export default defineConfig({
  base: '/meus-treinos/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Meus Treinos',
        short_name: 'Treinos',
        description: 'Minhas rotinas de treino, exercícios, séries e repetições.',
        theme_color: '#0b0b0d',
        background_color: '#0b0b0d',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/meus-treinos/',
        start_url: '/meus-treinos/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})

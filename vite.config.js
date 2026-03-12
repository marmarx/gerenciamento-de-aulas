import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'
// https://vite.dev/config/

export default defineConfig({

  plugins: [
    vue(),
    // vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: [ 'favicon.png', 'robots.txt' ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  server:{ host: true },

  esbuild: {
    drop: ['console', 'debugger'],  // remove all console and debugger calls from the code on build
  },

  build: {
    terserOptions: {
      format: { comments: false }, // remove all comments
    },
  },

})
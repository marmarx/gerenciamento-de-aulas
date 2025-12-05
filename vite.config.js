import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { VitePWA } from 'vite-plugin-pwa'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server:{
    host: true,
  },
  esbuild: {
    drop: ['console', 'debugger'],  // remove all console and debugger calls from the code on build
    minify: true, // remove all comments
  },
  build: {
    terserOptions: {
      format: {
        comments: false, // remove all comments
      },
    },
  },
})

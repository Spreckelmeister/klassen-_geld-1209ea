import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/klassen-_geld-1209ea/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-dexie': ['dexie', 'dexie-react-hooks'],
          'vendor-pdf': ['jspdf'],
          'vendor-qr': ['qrcode'],
        },
      },
    },
  },
})

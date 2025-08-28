// apps/web/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // optional: map any stray @base44/sdk to our shim
      '@base44/sdk': path.resolve(__dirname, './src/api/base44Client.js'),
    },
  },
})

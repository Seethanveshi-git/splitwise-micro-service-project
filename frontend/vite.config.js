import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://ab086f79fc8ae4c7d8da2d9dee2f41ac-558621593.ap-south-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

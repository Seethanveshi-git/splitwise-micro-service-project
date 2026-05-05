import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://a2111ed9242a3472da01c23554fdc504-632350161.ap-south-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

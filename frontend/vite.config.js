import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://a59f46ee4ec974e09b44d96ba2cf3d6f-1884856289.ap-south-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

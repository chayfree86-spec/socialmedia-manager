import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy API calls to PHP backend (Apache/Nginx or PHP built-in server)
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        rewrite: (path) => '/socialmedia-manager/client/public' + path,
        // If using PHP built-in server: target: 'http://localhost:8080'
        // If using XAMPP/WAMP:          target: 'http://localhost:80'
        // If using Laragon:             target: 'http://localhost:80'
      }
    }
  }
})

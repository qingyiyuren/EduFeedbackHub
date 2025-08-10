// vite.config.js
// This configuration file sets up Vite for the React project.
// It enables the React plugin for JSX support and fast refresh during development.
// It also configures a development server proxy to forward API requests starting with /api
// to the local backend server (Django running on http://127.0.0.1:8000),
// avoiding CORS issues by rewriting and changing the request origin.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    'process.env': {}
  }
})


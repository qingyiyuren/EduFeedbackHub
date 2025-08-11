// vite.config.js
// This configuration file sets up Vite for the React project.
// It enables the React plugin for JSX support and fast refresh during development.
// It also configures a development server proxy to forward API requests starting with /api
// to the local backend server (Django running on http://127.0.0.1:8000),
// avoiding CORS issues by rewriting and changing the request origin.

import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
    const isProduction = command === 'build';
    
    // Load environment variables
    const env = mode === 'production' ? '.env.production' : '.env.local';
    
    return {
        plugins: [react()],

        // Build configuration for production
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

        // Environment variable handling - Fix production API URL logic
        define: {
            'import.meta.env.VITE_API_URL': JSON.stringify(
                isProduction 
                    ? (process.env.VITE_API_URL || 'https://edufeedbackhub.onrender.com')
                    : 'http://localhost:8000'
            )
        },

        server: {
            port: 3000,
            proxy: {
                // When a request starts with /api during development, use the proxy
                '/api': {
                    // Target server to forward requests to (your local Django backend)
                    target: 'http://127.0.0.1:8000',

                    // Changes the origin of the host header to the target URL
                    // This helps to avoid CORS (Cross-Origin Resource Sharing) issues
                    changeOrigin: true,

                    // Rewrites the URL path.
                    // ^ is a regular expression anchor meaning "start of the string"
                    // This replaces the initial /api with /api — effectively no change in this case
                    rewrite: (path) => path.replace(/^\/api/, '/api'),
                },
            },
        }
    };
});


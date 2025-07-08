// vite.config.js
// This configuration file sets up Vite for the React project.
// It enables the React plugin for JSX support and fast refresh during development.
// It also configures a development server proxy to forward API requests starting with /api
// to the local backend server (Django running on http://127.0.0.1:8000),
// avoiding CORS issues by rewriting and changing the request origin.

import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
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
    },
});


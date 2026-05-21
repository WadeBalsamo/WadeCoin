import { defineConfig } from 'vite';

export default defineConfig({
  // ng build outputs compiled JS + index.html here; Vite serves it.
  root: 'dist/browser',
  base: '/',
  server: {
    port: 4200,
    host: '0.0.0.0',
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4200,
    host: '0.0.0.0',
  },
});

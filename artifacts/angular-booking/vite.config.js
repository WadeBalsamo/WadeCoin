import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: '/',
  publicDir: 'public',
  server: {
    port: 4200,
    host: '0.0.0.0',
    strictPort: false,
    middlewareMode: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist/browser',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: true,
  },
  preview: {
    port: 4200,
    host: '0.0.0.0',
  },
});

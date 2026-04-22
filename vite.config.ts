import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    allowedHosts: ['primal-fracture.onrender.com'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    outDir: 'docs', // This tells Vite to name the folder 'docs' instead of 'dist'
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
});
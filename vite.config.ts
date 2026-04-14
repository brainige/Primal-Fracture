import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-oxc'; // Changed from plugin-react-oxc as it was deprecated
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
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
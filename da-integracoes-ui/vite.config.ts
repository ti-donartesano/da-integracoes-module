import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: 'src/index.tsx',
      output: {
        entryFileNames: 'integracoes-bundle.js',
        assetFileNames: 'style.css',
        format: 'iife'
      }
    },
    cssCodeSplit: false,
  }
});

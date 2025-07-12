import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8090,
    middlewareMode: false
  },
  build: {
    outDir: 'dist',
    manifest: true,
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash].[ext]',
        manualChunks: undefined, // Disable chunking to save memory
      },
    },
    target: 'es2015', // Lower target to reduce complexity
    modulePreload: false,
  },
});

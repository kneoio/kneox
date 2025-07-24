import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  base: '/player/',   
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
        entryFileNames: 'assets/[name].[hash].js',      // Add 'assets/' prefix
        chunkFileNames: 'assets/[name].[hash].js',     // Add 'assets/' prefix
        assetFileNames: 'assets/[name].[hash].[ext]',  // Add 'assets/' prefix
        manualChunks: undefined,
      },
    },
    target: 'es2015',
    modulePreload: false,
  },
});
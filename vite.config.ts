import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    port: 8090,
    middlewareMode: false
  },
  build: {
    outDir: 'dist',
    manifest: true,
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.ts'),
      output: {
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash].[ext]',
      },
    },
    target: 'esnext',
    modulePreload: true,
  },
});

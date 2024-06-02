import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    port: 8090,
  },
  build: {
    outDir: 'dist',
    manifest: true, // Ensure manifest file is generated
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
    target: 'es2015',
  },
});

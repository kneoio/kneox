import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8090,
  },
  build: {
    outDir: 'dist',
    manifest: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main.ts'),
      },
    },
  },
});

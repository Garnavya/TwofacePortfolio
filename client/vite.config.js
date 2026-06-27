import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdirSync } from 'node:fs';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Copy client/js to dist/js — scripts are classic (non-module) and linked from HTML. */
function copyClientJs() {
  return {
    name: 'copy-client-js',
    closeBundle() {
      const dest = resolve(__dirname, '../dist/js');
      mkdirSync(dest, { recursive: true });
      cpSync(resolve(__dirname, 'js'), dest, { recursive: true });
    },
  };
}

export default defineConfig({
  root: __dirname,
  server: {
    host: '127.0.0.1',
    port: Number(process.env.VITE_DEV_PORT) || 5173,
    strictPort: true,
    proxy: {
      // Forward anything starting with /api to the Express backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  plugins: [copyClientJs()],
  build: {
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        code: resolve(__dirname, 'code.html'),
        snap: resolve(__dirname, 'snap.html'),
      },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  root,
  plugins: [react()],
  css: { postcss: { plugins: [] } },
  build: { outDir: '../dist', emptyOutDir: true, chunkSizeWarningLimit: 800 },
  server: { proxy: { '/api': 'http://127.0.0.1:8282' } },
  test: { root, include: ['src/**/*.test.ts'], environment: 'node' },
});

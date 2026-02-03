import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'vercel_output',
    emptyOutDir: true,
    rollupOptions: {
      // Only externalize in Electron builds, not Web builds
      external: process.env.ELECTRON === 'true' ? ['electron', 'fs', 'path', 'crypto', 'child_process'] : []
    }
  },
  optimizeDeps: {
    exclude: ['electron']
  }
});

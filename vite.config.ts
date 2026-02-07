import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-v301.js`,
        chunkFileNames: `assets/[name]-[hash]-v301.js`,
        assetFileNames: `assets/[name]-[hash]-v301.[ext]`
      },
      // Only externalize in Electron builds, not Web builds
      external: process.env.ELECTRON === 'true' ? ['electron', 'fs', 'path', 'crypto', 'child_process'] : []
    }
  },
  optimizeDeps: {
    exclude: ['electron']
  }
});

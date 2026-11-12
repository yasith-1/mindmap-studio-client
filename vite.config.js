import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      output: {
        // Split large, rarely-changing libraries into their own chunks. They
        // download in parallel and stay cached across app deploys instead of
        // being re-fetched inside one monolithic entry bundle.
        manualChunks: {
          react: ['react', 'react-dom'],
          d3: ['d3'],
          markmap: ['markmap-lib', 'markmap-view'],
        },
      },
    },
  },
});

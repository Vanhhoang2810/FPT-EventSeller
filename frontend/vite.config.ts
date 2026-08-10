import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) return 'vendor-charts';
          if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router';
          if (id.includes('@reduxjs') || id.includes('react-redux') || id.includes('immer')) return 'vendor-redux';
          if (id.includes('framer-motion') || id.includes('sonner') || id.includes('next-themes')) return 'vendor-ui';
          if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) return 'vendor-forms';
          if (id.includes('react') || id.includes('scheduler') || id.includes('prop-types')) return 'vendor-react';
          return 'vendor-misc';
        },
      },
    },
  },
  server: {
    allowedHosts: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});

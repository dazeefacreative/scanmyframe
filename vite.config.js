import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 2000,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 2000,
    },
    proxy: {
      '/api': 'http://localhost:4000',
      '/sitemap.xml': {
        target: `${process.env.VITE_SUPABASE_URL}/functions/v1/sitemap`,
        changeOrigin: true,
        rewrite: () => '',
      },
    }
  }
});

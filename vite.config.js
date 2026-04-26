import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 2000,
    proxy: {
      '/api': 'http://localhost:4000',
      '/sitemap.xml': {
        target: 'https://kbqgclcpdljobnbcctpo.supabase.co/functions/v1/sitemap',
        changeOrigin: true,
        rewrite: () => '',
      },
    }
  }
});

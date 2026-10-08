import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  devToolbar: { enabled: false },
  vite: {
    build: { assetsInlineLimit: 2048 }
  }
});

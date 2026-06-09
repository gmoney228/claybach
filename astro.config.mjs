import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://claybach.com',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
});

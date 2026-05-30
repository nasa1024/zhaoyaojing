import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.aicheck365.com',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      filter: (page) => !page.endsWith('/404/'),
    }),
  ],
  build: {
    format: 'directory', // /platforms/midjourney/ → /platforms/midjourney/index.html
  },
});

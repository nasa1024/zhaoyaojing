import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// lastmod comes from the content registries' updatedAt; locale variants of a
// page share the base route's date. Google ignores changefreq/priority, so
// only url + lastmod are emitted.
const SUPPORTED_LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR'];
const registeredPages = ['tools', 'platforms', 'articles'].flatMap((name) =>
  JSON.parse(readFileSync(new URL(`./src/data/content/${name}.json`, import.meta.url), 'utf8')),
);

function baseRoute(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && SUPPORTED_LANGS.includes(parts[0])) parts.shift();
  return parts.length ? `/${parts.join('/')}/` : '/';
}

const lastmodByRoute = new Map();
for (const page of registeredPages) {
  if (!page.updatedAt) continue;
  const route = baseRoute(new URL(page.route, 'https://www.aicheck365.com').pathname);
  const prev = lastmodByRoute.get(route);
  if (!prev || page.updatedAt > prev) lastmodByRoute.set(route, page.updatedAt);
}

export default defineConfig({
  site: 'https://www.aicheck365.com',
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/404/'),
      serialize(item) {
        const lastmod = lastmodByRoute.get(baseRoute(new URL(item.url).pathname));
        return lastmod ? { url: item.url, lastmod } : { url: item.url };
      },
    }),
  ],
  build: {
    format: 'directory', // /platforms/midjourney/ → /platforms/midjourney/index.html
  },
});

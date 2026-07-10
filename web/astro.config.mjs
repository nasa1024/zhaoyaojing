import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// Exact locale dates come from content registries. Shared template dates are
// explicit fallbacks in sitemap-lastmod.json, so a localized page can override
// its family without falsely updating every translation. Only url + lastmod
// are emitted because Google ignores changefreq/priority.
const SUPPORTED_LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR'];
const registeredPages = ['tools', 'platforms', 'articles'].flatMap((name) =>
  JSON.parse(readFileSync(new URL(`./src/data/content/${name}.json`, import.meta.url), 'utf8')),
);
const sitemapDates = JSON.parse(
  readFileSync(new URL('./src/data/sitemap-lastmod.json', import.meta.url), 'utf8'),
);

function baseRoute(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && SUPPORTED_LANGS.includes(parts[0])) parts.shift();
  return parts.length ? `/${parts.join('/')}/` : '/';
}

function normalizedPath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  return parts.length ? `/${parts.join('/')}/` : '/';
}

function setLatest(map, route, updatedAt) {
  if (!updatedAt) return;
  const previous = map.get(route);
  if (!previous || updatedAt > previous) map.set(route, updatedAt);
}

const exactLastmodByPath = new Map(Object.entries(sitemapDates.exact || {}));
const localizedLastmodByRoute = new Map(Object.entries(sitemapDates.allLocales || {}));
for (const page of registeredPages) {
  const route = normalizedPath(new URL(page.route, 'https://www.aicheck365.com').pathname);
  setLatest(exactLastmodByPath, route, page.updatedAt);
}

export default defineConfig({
  site: 'https://www.aicheck365.com',
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/404/'),
      serialize(item) {
        const pathname = normalizedPath(new URL(item.url).pathname);
        const lastmod = exactLastmodByPath.get(pathname)
          ?? localizedLastmodByRoute.get(baseRoute(pathname));
        return lastmod ? { url: item.url, lastmod } : { url: item.url };
      },
    }),
  ],
  build: {
    format: 'directory', // /platforms/midjourney/ → /platforms/midjourney/index.html
  },
});

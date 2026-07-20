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

// Dev-only middleware: src modules dynamically import plain JS files served
// from /public (e.g. /scripts/i18n.js, /pkg/aicheck.js). Vite dev appends
// `?import` to those requests and then refuses to serve public files as
// modules (500 + error overlay). Stripping the query before vite's own
// middlewares lets the static middleware serve the file as-is. Production
// builds are unaffected (the files are fetched directly at runtime).
const devPublicModuleFix = {
  name: 'dev-public-module-fix',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url?.includes('?import') && (req.url.startsWith('/scripts/') || req.url.startsWith('/pkg/'))) {
        req.url = req.url.replace('?import', '');
      }
      next();
    });
  },
};

export default defineConfig({
  site: 'https://www.aicheck365.com',
  vite: {
    plugins: [devPublicModuleFix],
  },
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

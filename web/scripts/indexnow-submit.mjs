// Submits the live sitemap's URLs to IndexNow (Bing, Yandex, Seznam, Naver)
// after a deploy. Failures are logged but never fail the deploy.
const SITE_URL = process.env.SITE_URL || 'https://www.aicheck365.com';
const INDEXNOW_KEY = '986c72acc1ce146056c775d4ee05df9c';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10000;

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'aicheck365-indexnow-submit' } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function collectSitemapUrls() {
  const index = await fetchText(`${SITE_URL}/sitemap-index.xml`);
  const childSitemaps = extractLocs(index);
  const urls = [];
  for (const sitemapUrl of childSitemaps) {
    urls.push(...extractLocs(await fetchText(sitemapUrl)));
  }
  return [...new Set(urls)];
}

async function submit(urlList) {
  const host = new URL(SITE_URL).host;
  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList,
  };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  // 200 = submitted, 202 = key validation pending; both are success.
  console.log(`IndexNow: submitted ${urlList.length} URLs -> HTTP ${res.status}`);
  if (![200, 202].includes(res.status)) {
    console.warn(`IndexNow: unexpected response: ${await res.text()}`);
  }
}

try {
  const urls = await collectSitemapUrls();
  if (!urls.length) throw new Error('sitemap returned no URLs');
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
    await submit(urls.slice(i, i + MAX_URLS_PER_REQUEST));
  }
} catch (err) {
  console.warn(`IndexNow submission skipped: ${err.message}`);
}

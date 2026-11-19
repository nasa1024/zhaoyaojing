import { test, expect } from '@playwright/test';

async function assertUniqueArticleParagraphs(page, route) {
  const paragraphs = await page.locator('article.content-article p').allInnerTexts();
  const normalized = paragraphs
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  expect(normalized.length, `${route}: expected multiple paragraphs`).toBeGreaterThanOrEqual(4);
  expect(new Set(normalized).size, `${route}: duplicated paragraphs found`).toBe(normalized.length);
}

const PRIVACY_CASES = [
  { route: '/privacy/', lang: 'zh-CN', h1: '隐私政策', updated: /2026\s*年\s*11\s*月/ },
  { route: '/en/privacy/', lang: 'en', h1: 'Privacy Policy', updated: /November 2026/ },
  { route: '/de/privacy/', lang: 'de', h1: 'Datenschutzerklärung', updated: /November 2026/ },
  { route: '/ja/privacy/', lang: 'ja', h1: 'プライバシーポリシー', updated: /2026\s*年\s*11\s*月/ },
];

for (const item of PRIVACY_CASES) {
  test(`privacy page ${item.route} has native non-duplicated copy and Impact.com/consent disclosures`, async ({ page }) => {
    await page.goto(item.route);
    await expect(page.locator('html')).toHaveAttribute('lang', item.lang);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(item.h1);

    const article = page.locator('article.content-article');
    await expect(article).toContainText(item.updated);
    await expect(article).toContainText(/WebAssembly|WASM/i);
    await expect(article).toContainText(/Google Analytics 4/i);
    await expect(article).toContainText(/Google AdSense/i);
    await expect(article).toContainText(/Impact\.com/i);
    await expect(article).toContainText(/contact@aicheck365\.com/);

    const impactPrivacyLink = article.locator('a[href="https://impact.com/privacy-policy/"]');
    await expect(impactPrivacyLink).toHaveAttribute('target', '_blank');
    await expect(impactPrivacyLink).toHaveAttribute('rel', /noopener/);
    await expect(impactPrivacyLink).toHaveAttribute('rel', /noreferrer/);

    await assertUniqueArticleParagraphs(page, item.route);
  });
}

for (const item of [
  { route: '/about/', lang: 'zh-CN', h1: '关于 AICheck365' },
  { route: '/en/about/', lang: 'en', h1: 'About AICheck365' },
]) {
  test(`about page ${item.route} includes #editorial-independence, repo attribution and valid AboutPage JSON-LD`, async ({ page }) => {
    await page.goto(item.route);
    await expect(page.locator('html')).toHaveAttribute('lang', item.lang);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(item.h1);

    const disclosure = page.locator('#editorial-independence');
    await expect(disclosure).toBeVisible();
    await expect(disclosure).toContainText(/Impact\.com/i);
    await expect(disclosure).toContainText(/rel="sponsored"/);
    await expect(disclosure).toContainText(/contact@aicheck365\.com/);

    const article = page.locator('article.content-article');
    await expect(article.locator('a[href="https://github.com/nasa1024/zhaoyaojing"]').first()).toBeVisible();
    await expect(article.locator('a[href="https://github.com/MatrixA/aicheck"]')).toHaveCount(1);
    await expect(article.locator('.about-stats a[href*="MatrixA/aicheck"]')).toHaveCount(0);

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allInnerTexts();
    const parsedNodes = jsonLdScripts.flatMap((raw) => {
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [data];
    });
    const aboutSchema = parsedNodes.find((node) => node['@type'] === 'AboutPage');
    expect(aboutSchema).toBeTruthy();
    expect(aboutSchema.dateModified).toBe('2026-11-19');

    await assertUniqueArticleParagraphs(page, item.route);
  });
}

for (const item of [
  { route: '/terms/', lang: 'zh-CN', h1: '服务条款', updated: /2026\s*年\s*11\s*月/ },
  { route: '/en/terms/', lang: 'en', h1: 'Terms of Service', updated: /November 2026/ },
]) {
  test(`terms page ${item.route} covers non-forensic limits, attribution and Impact.com affiliate links`, async ({ page }) => {
    await page.goto(item.route);
    await expect(page.locator('html')).toHaveAttribute('lang', item.lang);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(item.h1);

    const article = page.locator('article.content-article');
    await expect(article).toContainText(item.updated);
    await expect(article).toContainText(/Impact\.com/i);
    await expect(article.locator('a[href="https://github.com/nasa1024/zhaoyaojing"]')).toHaveCount(1);
    await expect(article.locator('a[href="https://github.com/MatrixA/aicheck"]')).toHaveCount(1);
    await expect(article).toContainText(/contact@aicheck365\.com/);

    await assertUniqueArticleParagraphs(page, item.route);
  });
}

for (const item of [
  { route: '/contact/', lang: 'zh-CN', h1: '联系 AICheck365', responseRegex: /3–5/ },
  { route: '/en/contact/', lang: 'en', h1: 'Contact AICheck365', responseRegex: /3–5 business days/ },
]) {
  test(`contact page ${item.route} uses project issues repo, partnership inquiry instructions and zero upstream issues links`, async ({ page, request }) => {
    const html = await (await request.get(item.route)).text();
    expect(html).not.toContain('MatrixA/aicheck/issues');

    await page.goto(item.route);
    await expect(page.locator('html')).toHaveAttribute('lang', item.lang);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(item.h1);

    const article = page.locator('article.content-article');
    await expect(article.locator('a[href="mailto:contact@aicheck365.com"]')).toBeVisible();
    await expect(article).toContainText(/PARTNERSHIP/);
    await expect(article).toContainText(item.responseRegex);
    await expect(article.locator('a[href="https://github.com/nasa1024/zhaoyaojing/issues"]')).toBeVisible();

    await assertUniqueArticleParagraphs(page, item.route);
  });
}

test('non-Chinese/non-Japanese localized legal pages have zero stray CJK characters in article body', async ({ page }) => {
  const nonCjkLocales = ['en', 'ko', 'de', 'fr', 'es', 'pt-BR'];
  const paths = ['about', 'contact', 'privacy', 'terms'];

  for (const lang of nonCjkLocales) {
    for (const p of paths) {
      const route = `/${lang}/${p}/`;
      await page.goto(route);
      await expect(page.locator('h1'), route).toHaveCount(1);
      const bodyText = await page.locator('article.content-article').innerText();
      const strayCjk = bodyText.match(/[\u3400-\u9fff]/g) || [];
      expect(strayCjk, `${route}: unexpected CJK chars ${strayCjk.join('')}`).toHaveLength(0);
    }
  }
});

test('robots.txt disallows /go/ under User-agent: * while keeping Allow: / and AI crawlers', async ({ request }) => {
  const resp = await request.get('/robots.txt');
  expect(resp.ok()).toBeTruthy();
  const txt = await resp.text();
  expect(txt).toContain('User-agent: *\nDisallow: /go/\nAllow: /');
  expect(txt).toContain('User-agent: GPTBot');
});

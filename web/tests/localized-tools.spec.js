import { test, expect } from '@playwright/test';

const locales = ['zh-TW', 'ja', 'ko', 'de'];
const routes = [
  'tools',
  'tools/c2pa-validator',
  'tools/c2pa-viewer',
  'tools/exif-xmp-reader',
  'tools/png-parameter-extractor',
  'tools/mp4-metadata-inspector',
];

test('Japanese, Korean, Traditional Chinese and German tool routes are static and canonical', async ({ request }) => {
  test.setTimeout(120000);
  for (const locale of locales) {
    for (const route of routes) {
      const pathname = `/${locale}/${route}/`;
      const response = await request.get(pathname);
      expect(response.ok(), pathname).toBeTruthy();
      const html = await response.text();
      expect(html, pathname).toContain(`<html lang="${locale}">`);
      expect((html.match(/<h1\b/g) || []).length, pathname).toBe(1);
      expect(html, pathname).toContain(`rel="canonical" href="https://www.aicheck365.com${pathname}"`);
      expect(html, pathname).toContain(`hreflang="${locale}" href="https://www.aicheck365.com${pathname}"`);
      expect(html, pathname).toContain('hreflang="x-default"');
      expect(html, pathname).toContain(`href="/${locale}/tools/"`);
    }
  }
});

test('localized content pages expose localized tool links in server-rendered HTML', async ({ request }) => {
  const pages = [
    ['/zh-TW/platforms/gemini/', 'zh-TW'],
    ['/ja/platforms/comfyui/', 'ja'],
    ['/ko/platforms/comfyui/', 'ko'],
    ['/de/platforms/firefly/', 'de'],
  ];

  for (const [pathname, locale] of pages) {
    const response = await request.get(pathname);
    expect(response.ok(), pathname).toBeTruthy();
    const html = await response.text();

    expect(html, pathname).toContain(`href="/${locale}/tools/`);
    expect(html, pathname).not.toContain('href="/en/tools/');
    expect(html, pathname).not.toContain('https://www.aicheck365.com/en/tools/');
    if (locale === 'zh-TW') expect(html, pathname).not.toContain('href="/tools/');
  }
});

test('localized ComfyUI tool exposes the real browser-local inspector', async ({ page }) => {
  await page.goto('/ja/tools/png-parameter-extractor/');
  await expect(page.locator('h1')).toContainText('ComfyUI');
  await expect(page.locator('#tool-file-input')).toHaveAttribute('accept', /png/);
  await expect(page.locator('#tool-filter')).toBeVisible();
  await expect(page.locator('#tool-copy')).toBeVisible();
  await expect(page.locator('#tool-export')).toBeVisible();
  await expect(page.locator('.site-nav a[href="/ja/tools/"]')).toBeVisible();
});

import { test, expect } from '@playwright/test';

const languageClusterPages = [
  { path: 'contact', zhHeading: '联系 AICheck365', enHeading: 'Contact AICheck365' },
  { path: 'privacy', zhHeading: '隐私政策', enHeading: 'Privacy Policy' },
  { path: 'terms', zhHeading: '服务条款', enHeading: 'Terms of Service' },
];

for (const item of languageClusterPages) {
  test(`${item.path} root is zh-CN and English is served at /en`, async ({ page }) => {
    await page.goto(`/${item.path}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.locator('h1')).toHaveText(item.zhHeading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com/${item.path}/`
    );
    await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com/${item.path}/`
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com/en/${item.path}/`
    );

    await page.goto(`/en/${item.path}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText(item.enHeading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com/en/${item.path}/`
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com/en/${item.path}/`
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com/en/${item.path}/`
    );
  });
}

test('404 is noindex and does not advertise nonexistent language variants', async ({ page }) => {
  await page.goto('/404/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
});

test('single-language English research pages keep their declared language after hydration', async ({ page }) => {
  await page.goto('/research/');
  await expect(page.locator('body')).toHaveAttribute('data-single-lang', 'true');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#lang-switch')).toHaveValue('en');
  await expect(page.locator('.site-nav a[data-i18n="nav.tools"]')).toHaveAttribute('href', '/en/tools/');
  await expect(page.locator('.site-nav a[data-i18n="nav.platforms"]')).toHaveAttribute('href', '/en/platforms/');
});

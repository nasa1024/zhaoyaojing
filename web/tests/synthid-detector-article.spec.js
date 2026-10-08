import { test, expect } from '@playwright/test';

const SLUG = 'synthid-detector';

for (const [path, lang, h1] of [
  [`/en/blog/${SLUG}/`, 'en', 'SynthID Detector explained'],
  [`/blog/${SLUG}/`, 'zh-CN', 'SynthID Detector 详解'],
]) {
  test(`${lang} SynthID Detector article is indexable and cross-linked`, async ({ page }) => {
    await page.goto(path);

    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('h1')).toContainText(h1);
    await expect(page.locator('#key-facts')).toContainText('synthid.com');
    await expect(page.locator('a[href="https://synthid.com/"]').first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.aicheck365.com${path}`);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://www.aicheck365.com/en/blog/${SLUG}/`);
    await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute('href', `https://www.aicheck365.com/blog/${SLUG}/`);
  });
}

test('blog indexes and Gemini guides link to the SynthID Detector article', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page.locator(`a[href="/blog/${SLUG}/"]`)).toHaveCount(1);
  await page.goto('/en/blog/');
  await expect(page.locator(`a[href="/en/blog/${SLUG}/"]`)).toHaveCount(1);
  await page.goto('/blog/how-to-detect-gemini-generated-images/');
  await expect(page.locator(`a[href="/blog/${SLUG}/"]`)).toHaveCount(1);
  await page.goto('/en/blog/how-to-detect-gemini-generated-images/');
  await expect(page.locator(`a[href="/en/blog/${SLUG}/"]`)).toHaveCount(1);
});

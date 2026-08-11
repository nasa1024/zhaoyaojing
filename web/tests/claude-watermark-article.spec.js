import { test, expect } from '@playwright/test';

const SLUG = 'claude-watermark-explained';

test('English Claude watermark article is crawlable, source-backed, and cautious', async ({ page }) => {
  await page.goto(`/en/blog/${SLUG}/`);

  await expect(page.locator('h1')).toContainText('useful transparency');
  await expect(page.locator('.priority-direct-answer')).toContainText('not yet an open');
  await expect(page.getByText('What a detected mark can—and cannot—prove')).toBeVisible();
  await expect(page.getByText('How Claude’s approach compares with existing marking methods')).toBeVisible();
  await expect(page.getByText('Google SynthID Text')).toBeVisible();
  await expect(page.getByText('C2PA / Content Credentials')).toBeVisible();
  await expect(page.getByText('Classifier-based AI detectors')).toBeVisible();
  await expect(page.getByText('Does no watermark mean the text is human-written?')).toBeVisible();

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href', `https://www.aicheck365.com/en/blog/${SLUG}/`,
  );
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href', `https://www.aicheck365.com/en/blog/${SLUG}/`,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="zh-TW"]')).toHaveAttribute(
    'href', `https://www.aicheck365.com/zh-TW/blog/${SLUG}/`,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="ja"]')).toHaveCount(0);

  await expect(page.locator('a[href*="support.claude.com/en/articles/16266773"]')).toHaveCount(1);
  await expect(page.locator('a[href="/en/tools/c2pa-validator/"]')).toBeVisible();
});

test('Traditional Chinese Claude watermark article is fully localized', async ({ page }) => {
  await page.goto(`/zh-TW/blog/${SLUG}/`);

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
  await expect(page.locator('h1')).toContainText('有助透明');
  await expect(page.getByText('先說結論')).toBeVisible();
  await expect(page.getByText('Claude 與市場上現有標記方法有何不同')).toBeVisible();
  await expect(page.getByText('可信任的 Claude 浮水印檢查器應該怎麼回報')).toBeVisible();
  await expect(page.getByText('沒有浮水印就代表人類撰寫嗎？')).toBeVisible();
  await expect(page.locator('a[href="/zh-TW/tools/c2pa-validator/"]')).toBeVisible();

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href', `https://www.aicheck365.com/zh-TW/blog/${SLUG}/`,
  );
});

test('English and Traditional Chinese blog indexes surface the new article', async ({ page }) => {
  await page.goto('/en/blog/');
  await expect(page.locator(`.blog-card[href="/en/blog/${SLUG}/"]`)).toHaveCount(1);
  await expect(page.locator(`.blog-card[href="/en/blog/${SLUG}/"] h2`)).toContainText('Claude Watermark');

  await page.goto('/zh-TW/blog/');
  await expect(page.locator(`.blog-card[href="/zh-TW/blog/${SLUG}/"]`)).toHaveCount(1);
  await expect(page.locator(`.blog-card[href="/zh-TW/blog/${SLUG}/"] h2`)).toContainText('Claude 浮水印');
});

test('unsupported language selection leaves the bilingual article path safely', async ({ page }) => {
  await page.goto(`/en/blog/${SLUG}/`);
  await page.locator('#lang-switch').selectOption('ja');
  await page.waitForURL('/ja/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
});

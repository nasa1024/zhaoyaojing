import { test, expect } from '@playwright/test';

const SLUG = 'claude-watermark-explained';

test('English Claude watermark article reflects the revised mechanism and scope', async ({ page }) => {
  await page.goto(`/en/blog/${SLUG}/`);

  await expect(page.locator('h1')).toContainText('how it works');
  await expect(page.locator('.article-meta')).toContainText('Updated August 16, 2026');
  await expect(page.locator('.article-update')).toContainText('not hidden Unicode');
  await expect(page.locator('.priority-direct-answer')).toContainText('Not reliably from an independent website yet');
  await expect(page.getByText('How Claude’s statistical text watermark works')).toBeVisible();
  await expect(page.getByText('Why a zero-width-character checker is not a Claude watermark detector')).toBeVisible();
  await expect(page.getByText('What the EU rules actually require—and exclude')).toBeVisible();
  await expect(page.getByText('Standard editing assistance', { exact: true })).toBeVisible();
  await expect(page.getByText('Source code', { exact: true })).toBeVisible();
  await expect(page.getByText('Hidden Unicode and formatting scanners', { exact: true })).toBeVisible();
  await expect(page.getByText('Does no watermark mean the text is human-written?')).toBeVisible();
  await expect(page.locator('.site-nav a[href="/en/blog/"]')).toHaveText('Blog');

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
  await expect(page.locator('a[href*="businessinsider.com/anthropic-reveals-more"]')).toHaveCount(1);
  await expect(page.locator('a[href="https://news.ycombinator.com/item?id=49319556"]')).toHaveCount(1);
  await expect(page.locator('a[href="/en/tools/c2pa-validator/"]')).toBeVisible();

  const articleSchema = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts
      .flatMap((script) => {
        try {
          const parsed = JSON.parse(script.textContent || 'null');
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [];
        }
      })
      .find((entry) => entry?.['@type'] === 'Article'),
  );
  expect(articleSchema?.datePublished).toBe('2026-08-11');
  expect(articleSchema?.dateModified).toBe('2026-08-16');
});

test('Traditional Chinese Claude watermark article is fully localized and updated', async ({ page }) => {
  await page.goto(`/zh-TW/blog/${SLUG}/`);

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
  await expect(page.locator('h1')).toContainText('2026 更新');
  await expect(page.locator('.article-meta')).toContainText('更新於 2026 年 8 月 16 日');
  await expect(page.getByText('8 月 16 日更新：Anthropic 新增了哪些說明')).toBeVisible();
  await expect(page.getByText('Claude 的統計式文字浮水印如何運作')).toBeVisible();
  await expect(page.getByText('為什麼零寬字元檢查器不是 Claude 浮水印偵測器')).toBeVisible();
  await expect(page.getByText('歐盟規則真正要求什麼，又排除了什麼')).toBeVisible();
  await expect(page.getByText('標準編輯輔助', { exact: true })).toBeVisible();
  await expect(page.getByText('原始程式碼', { exact: true })).toBeVisible();
  await expect(page.getByText('可信任的 Claude 浮水印檢查器應該怎麼回報')).toBeVisible();
  await expect(page.getByText('Claude 浮水印是隱藏 Unicode 嗎？')).toBeVisible();
  await expect(page.locator('a[href="/zh-TW/tools/c2pa-validator/"]')).toBeVisible();
  await expect(page.locator('.site-nav a[href="/zh-TW/blog/"]')).toHaveText('部落格');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href', `https://www.aicheck365.com/zh-TW/blog/${SLUG}/`,
  );
});

test('English and Traditional Chinese blog indexes feature the revised Claude article', async ({ page }) => {
  await page.goto('/en/blog/');
  const englishFeatured = page.locator(`[data-featured-article][href="/en/blog/${SLUG}/"]`);
  await expect(page.locator('h1')).toContainText('Blog');
  await expect(page.getByText('Updated featured analysis', { exact: true })).toBeVisible();
  await expect(englishFeatured).toHaveCount(1);
  await expect(englishFeatured.locator('h2')).toContainText('How It Works');
  await expect(englishFeatured).toContainText('not hidden Unicode');
  await expect(englishFeatured).toContainText('2026-08-16');
  await expect(page.locator(`.blog-grid .blog-card[href="/en/blog/${SLUG}/"]`)).toHaveCount(0);

  await page.goto('/zh-TW/blog/');
  const traditionalFeatured = page.locator(`[data-featured-article][href="/zh-TW/blog/${SLUG}/"]`);
  await expect(page.locator('h1')).toContainText('部落格');
  await expect(page.getByText('最新更新分析', { exact: true })).toBeVisible();
  await expect(traditionalFeatured).toHaveCount(1);
  await expect(traditionalFeatured.locator('h2')).toContainText('2026 更新');
  await expect(traditionalFeatured).toContainText('隱藏 Unicode');
  await expect(traditionalFeatured).toContainText('2026-08-16');
  await expect(page.locator(`.blog-grid .blog-card[href="/zh-TW/blog/${SLUG}/"]`)).toHaveCount(0);
});

test('root blog exposes the bilingual Claude article entry', async ({ page }) => {
  await page.goto('/blog/');

  const feature = page.locator('[data-claude-feature]');
  await expect(feature).toHaveCount(1);
  await expect(feature.locator('h2')).toContainText('Claude 文字水印 2026 更新');
  await expect(feature).toContainText('不是隐藏 Unicode');
  await expect(feature.locator(`a[href="/zh-TW/blog/${SLUG}/"]`)).toHaveText('阅读繁体中文版');
  await expect(feature.locator(`a[href="/en/blog/${SLUG}/"]`)).toHaveText('Read in English');
});

test('Blog is a visible top-level header item on detector and tool layouts', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('.site-nav a[href="/en/blog/"]')).toHaveText('Blog');

  await page.goto('/zh-TW/');
  await expect(page.locator('.site-nav a[href="/zh-TW/blog/"]')).toHaveText('部落格');

  await page.goto('/en/tools/');
  await expect(page.locator('.site-nav a[href="/en/blog/"]')).toHaveText('Blog');

  await page.goto('/zh-TW/tools/');
  await expect(page.locator('.site-nav a[href="/zh-TW/blog/"]')).toHaveText('部落格');
});

test('unsupported language selection leaves the bilingual article path safely', async ({ page }) => {
  await page.goto(`/en/blog/${SLUG}/`);
  await page.locator('#lang-switch').selectOption('ja');
  await page.waitForURL('/ja/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
});

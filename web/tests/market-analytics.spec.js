import { test, expect } from '@playwright/test';

test('market analytics enriches events with locale, page type and landing path', async ({ page }) => {
  await page.goto('/de/');
  const params = await page.evaluate(() => {
    window.gtag('event', 'market_context_probe', { probe: 'ok' });
    const item = [...window.dataLayer].reverse().find((entry) => entry?.[0] === 'event' && entry?.[1] === 'market_context_probe');
    return item?.[2] || null;
  });
  expect(params).toMatchObject({
    probe: 'ok',
    page_locale: 'de',
    page_type: 'home',
    tool_type: 'site',
    page_path: '/de/',
    landing_path: '/de/',
  });
});

test('legacy English tool links are localized for target-language content pages', async ({ page }) => {
  await page.goto('/ja/blog/how-to-detect-ai-images/');
  const localized = page.locator('a[href^="/ja/tools/"]');
  await expect(localized.first()).toBeVisible();
  expect(await localized.count()).toBeGreaterThan(0);
});

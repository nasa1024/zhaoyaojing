import { test, expect } from '@playwright/test';

const IMPACT_URL = 'https://utt.impactcdn.com/P-A8151808-6473-4831-b4b6-3341eeb5b97c1.js';

async function interceptImpact(page) {
  const requests = [];
  await page.route('**/utt.impactcdn.com/**', async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: '/* mocked impact stat */',
    });
  });
  return requests;
}

test('EEA locale /de/ blocks Impact.com STAT before consent and links localized privacy policy', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const impactRequests = await interceptImpact(page);

  await page.goto('/de/');
  await page.waitForLoadState('load');
  await page.waitForTimeout(300);

  const banner = page.locator('#consent-banner');
  await expect(banner).toBeVisible();
  await expect(banner.locator('a')).toHaveAttribute('href', '/de/privacy/');
  await expect(banner).toContainText(/Affiliate/i);

  expect(impactRequests).toHaveLength(0);
  const impactStatType = await page.evaluate(() => typeof window.impactStat);
  expect(impactStatType).toBe('undefined');

  await context.close();
});

test('choosing essential_only on /de/ keeps Impact.com unloaded', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const impactRequests = await interceptImpact(page);

  await page.goto('/de/');
  await page.locator('[data-consent-choice="essential_only"]').click();
  await expect(page.locator('#consent-banner')).toHaveCount(0);

  await page.waitForTimeout(300);
  expect(impactRequests).toHaveLength(0);
  expect(await page.evaluate(() => typeof window.impactStat)).toBe('undefined');
  expect(await page.evaluate(() => window.__AICHECK_LOAD_IMPACT__?.())).toBe(false);
  expect(impactRequests).toHaveLength(0);

  await page.reload();
  await page.waitForLoadState('load');
  await page.waitForTimeout(300);
  await expect(page.locator('#consent-banner')).toHaveCount(0);
  expect(impactRequests).toHaveLength(0);

  await context.close();
});

test('choosing granted_all on /de/ injects Impact.com STAT once and queues transformLinks + trackImpression', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const impactRequests = await interceptImpact(page);

  await page.goto('/de/');
  await page.locator('[data-consent-choice="granted_all"]').click();
  await expect(page.locator('#consent-banner')).toHaveCount(0);

  await expect.poll(() => impactRequests.length).toBe(1);
  expect(impactRequests[0]).toBe(IMPACT_URL);

  const state = await page.evaluate(() => ({
    ireO: window.ire_o,
    loaded: window.__AICHECK_IMPACT_LOADED__,
    scriptCount: document.querySelectorAll('script[src*="utt.impactcdn.com"]').length,
    queue: Array.from(window.impactStat?.a || []).map((args) => Array.from(args)),
    secondCall: window.__AICHECK_LOAD_IMPACT__?.(),
    scriptCountAfter: document.querySelectorAll('script[src*="utt.impactcdn.com"]').length,
    queueAfter: Array.from(window.impactStat?.a || []).map((args) => Array.from(args)),
  }));

  expect(state.ireO).toBe('impactStat');
  expect(state.loaded).toBe(true);
  expect(state.scriptCount).toBe(1);
  expect(state.queue).toEqual([['transformLinks'], ['trackImpression']]);
  expect(state.secondCall).toBe(false);
  expect(state.scriptCountAfter).toBe(1);
  expect(state.queueAfter).toEqual([['transformLinks'], ['trackImpression']]);

  await context.close();
});

test('ToolBase /de/tools/ and /fr/, /es/ localize consent privacy href and gate Impact.com', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const impactRequests = await interceptImpact(page);

  await page.goto('/fr/');
  await expect(page.locator('#consent-banner a')).toHaveAttribute('href', '/fr/privacy/');
  expect(impactRequests).toHaveLength(0);

  await page.goto('/es/');
  await expect(page.locator('#consent-banner a')).toHaveAttribute('href', '/es/privacy/');
  expect(impactRequests).toHaveLength(0);

  await page.goto('/de/tools/');
  await expect(page.locator('#consent-banner')).toBeVisible();
  await expect(page.locator('#consent-banner a')).toHaveAttribute('href', '/de/privacy/');
  expect(impactRequests).toHaveLength(0);
  expect(await page.evaluate(() => typeof window.impactStat)).toBe('undefined');

  await page.locator('[data-consent-choice="granted_all"]').click();
  await expect.poll(() => impactRequests.length).toBe(1);

  await context.close();
});

test('non-EEA /en/ loads Impact.com after page load without banner interaction', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'America/New_York' });
  const page = await context.newPage();
  const impactRequests = await interceptImpact(page);

  await page.goto('/en/');
  await expect(page.locator('#consent-banner')).toHaveCount(0);

  await expect.poll(() => impactRequests.length, { timeout: 5000 }).toBe(1);
  expect(impactRequests[0]).toBe(IMPACT_URL);

  const queue = await page.evaluate(() =>
    Array.from(window.impactStat?.a || []).map((args) => Array.from(args))
  );
  expect(queue).toEqual([['transformLinks'], ['trackImpression']]);

  await context.close();
});

test('ToolBase /en/tools/ and Base layouts localize footer legal links and author/privacy link tags', async ({ page }) => {
  await page.goto('/en/tools/');
  const footer = page.locator('.site-footer .footer-links').first();
  for (const href of ['/en/about/', '/en/privacy/', '/en/terms/', '/en/contact/']) {
    await expect(footer.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
  await expect(page.locator('link[rel="author"]')).toHaveAttribute('href', 'https://www.aicheck365.com/en/about/');
  await expect(page.locator('link[rel="privacy-policy"]')).toHaveAttribute('href', 'https://www.aicheck365.com/en/privacy/');

  await page.goto('/de/');
  await expect(page.locator('link[rel="author"]')).toHaveAttribute('href', 'https://www.aicheck365.com/de/about/');
  await expect(page.locator('link[rel="privacy-policy"]')).toHaveAttribute('href', 'https://www.aicheck365.com/de/privacy/');

  await page.goto('/');
  await expect(page.locator('link[rel="author"]')).toHaveAttribute('href', 'https://www.aicheck365.com/about/');
  await expect(page.locator('link[rel="privacy-policy"]')).toHaveAttribute('href', 'https://www.aicheck365.com/privacy/');
});

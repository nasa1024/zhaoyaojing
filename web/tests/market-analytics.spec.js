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

test('GEO referral from ChatGPT or Claude is recorded in market context and fires geo_referral_landing', async ({ page }) => {
  await page.goto('/en/?utm_source=chatgpt.com');
  const data = await page.evaluate(() => {
    const geoEvent = [...window.dataLayer].find((entry) => entry?.[0] === 'event' && entry?.[1] === 'geo_referral_landing');
    return {
      context: window.__AICHECK_MARKET_CONTEXT__,
      geoEvent: geoEvent?.[2] || null,
    };
  });
  expect(data.context.ai_referrer).toBe('chatgpt');
  expect(data.geoEvent).toMatchObject({
    ai_referrer: 'chatgpt',
    page_locale: 'en',
    page_type: 'home',
  });
});

test('affiliate_click emits enriched tracking event into dataLayer without forbidden params', async ({ page }) => {
  await page.goto('/en/');
  const emitted = await page.evaluate(() => {
    const link = document.createElement('a');
    link.href = '/go/adobe-firefly';
    link.setAttribute('rel', 'sponsored noopener');
    link.dataset.affiliatePartner = 'adobe-firefly';
    link.dataset.affiliatePlacement = 'result-state-c';
    link.dataset.resultState = 'C';
    link.textContent = 'Adobe Firefly';
    link.addEventListener('click', (e) => e.preventDefault());
    document.body.appendChild(link);
    link.click();

    const fallbackLink = document.createElement('a');
    fallbackLink.href = '/go/canva-pro?ref=home';
    fallbackLink.textContent = 'Canva';
    fallbackLink.addEventListener('click', (e) => e.preventDefault());
    document.body.appendChild(fallbackLink);
    fallbackLink.click();

    return [...window.dataLayer]
      .filter((entry) => entry?.[0] === 'event' && entry?.[1] === 'affiliate_click')
      .map((entry) => entry?.[2]);
  });

  expect(emitted).toHaveLength(2);
  expect(emitted[0]).toMatchObject({
    page_locale: 'en',
    page_type: 'home',
    page_path: '/en/',
    partner: 'adobe-firefly',
    placement: 'result-state-c',
    result_state: 'C',
    rel_sponsored: true,
  });
  expect(emitted[1]).toMatchObject({
    page_locale: 'en',
    page_type: 'home',
    page_path: '/en/',
    partner: 'canva-pro',
    placement: 'inline',
    rel_sponsored: false,
  });
  expect(emitted[1].result_state).toBeUndefined();

  const FORBIDDEN_PARAM_KEYS = [
    'file_name', 'filename', 'file_path', 'filepath', 'gps', 'lat', 'lng',
    'latitude', 'longitude', 'prompt', 'exif', 'hash', 'sha', 'md5', 'serial',
    'certificate', 'raw_json', 'metadata_value',
  ];
  for (const params of emitted) {
    for (const key of Object.keys(params)) {
      const lower = key.toLowerCase();
      const hasForbidden = FORBIDDEN_PARAM_KEYS.some((f) => lower === f || lower.includes(f));
      expect(hasForbidden, `Forbidden param key "${key}" found`).toBe(false);
    }
  }
});

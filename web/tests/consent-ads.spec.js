import { test, expect } from '@playwright/test';

async function installGtagCapture(page) {
  await page.addInitScript(() => {
    try { localStorage.removeItem('aicheck_consent_v1'); } catch {}
    window.__ga_calls__ = [];
    window.gtag = function(type, name, params) {
      window.__ga_calls__.push({ type, name, params: params || {} });
    };
  });
}

function gaCalls(page) {
  return page.evaluate(() => window.__ga_calls__ || []);
}

test('EEA-style locales default Google consent to denied and show choices', async ({ page }) => {
  await installGtagCapture(page);
  await page.goto('/de/');
  await expect(page.locator('#consent-banner')).toBeVisible();

  const calls = await gaCalls(page);
  const defaults = calls.find((call) => call.type === 'consent' && call.name === 'default');
  expect(defaults.params).toMatchObject({
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
});

test('consent choice updates Google consent mode with grouped analytics only', async ({ page }) => {
  await installGtagCapture(page);
  await page.goto('/de/');
  await page.locator('[data-consent-choice="granted_all"]').click();
  await expect(page.locator('#consent-banner')).toHaveCount(0);

  const calls = await gaCalls(page);
  const update = calls.find((call) => call.type === 'consent' && call.name === 'update');
  expect(update.params).toMatchObject({
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  });
  const event = calls.find((call) => call.type === 'event' && call.name === 'consent_update');
  expect(event.params).toEqual({ consent_state_group: 'granted_all' });
});

test('non-EEA default route grants consent defaults without showing a banner', async ({ page }) => {
  await installGtagCapture(page);
  await page.goto('/en/');
  await expect(page.locator('#consent-banner')).toHaveCount(0);

  const calls = await gaCalls(page);
  const defaults = calls.find((call) => call.type === 'consent' && call.name === 'default');
  expect(defaults.params.analytics_storage).toBe('granted');
  expect(defaults.params.ad_storage).toBe('granted');
});

test('ad slots reserve space and stay away from dedicated tool controls', async ({ page }) => {
  await page.goto('/');
  const slots = await page.locator('.ad-slot').evaluateAll((els) =>
    els.map((el) => ({
      placement: el.getAttribute('data-ad-placement'),
      minHeight: Number.parseFloat(getComputedStyle(el).minHeight),
    }))
  );
  expect(slots.length).toBeGreaterThan(0);
  for (const slot of slots) {
    expect(slot.minHeight).toBeGreaterThanOrEqual(90);
  }
  expect(slots.map((slot) => slot.placement)).toContain('after-methodology');

  await page.goto('/tools/c2pa-validator/');
  await expect(page.locator('#tool-inspector .ad-slot')).toHaveCount(0);
});

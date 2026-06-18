import { test, expect } from '@playwright/test';

test('EvidenceVanish emphasis line renders server-side', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=没有找到证据，不代表它不是 AI')).toBeVisible();
});

test('FiveLayer has exactly 5 details elements', async ({ page }) => {
  await page.goto('/');
  const count = await page.locator('.evidence-layer').count();
  expect(count).toBe(5);
});

test('PlatformFingerprint capsule links to existing platform page', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('.platform-fingerprint a[href*="/platforms/midjourney/"]');
  await expect(link).toBeVisible();
});

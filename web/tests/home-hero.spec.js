import { test, expect } from '@playwright/test';

test('hero has upload-first CTA and no ad above the fold', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero-cta a[href="#upload-zone"]')).toBeVisible();
  const adAboveFold = await page.evaluate(() => {
    const ad = document.querySelector('.ad-slot'); if (!ad) return false;
    return ad.getBoundingClientRect().top < window.innerHeight;
  });
  expect(adAboveFold).toBe(false);
});

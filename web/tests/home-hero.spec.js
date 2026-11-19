import { test, expect } from '@playwright/test';

test('hero has upload-first CTA, hides empty ads by default, and keeps active ads below the fold', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero-cta a[href="#upload-zone"]')).toBeVisible();

  const ads = page.locator('.ad-slot');
  const count = await ads.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    await expect(ads.nth(i)).toHaveAttribute('data-ad-state', 'empty');
    await expect(ads.nth(i)).not.toBeVisible();
  }

  await ads.evaluateAll((els) => {
    els.forEach((el) => el.setAttribute('data-ad-state', 'active'));
  });
  await expect(ads.first()).toBeVisible();

  const adAboveFold = await page.evaluate(() => {
    const slots = Array.from(document.querySelectorAll('.ad-slot'));
    return slots.some((ad) => ad.getBoundingClientRect().top < window.innerHeight);
  });
  expect(adAboveFold).toBe(false);
});

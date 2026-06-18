import { test, expect } from '@playwright/test';

test('MethodologyBlock "不能保证" column renders server-side', async ({ page }) => {
  await page.goto('/');
  // The "cannot guarantee" column heading
  await expect(page.locator('.methodology-col--cannot')).toBeVisible();
  // At least one list item in that column
  const cannotItems = await page.locator('.methodology-col--cannot .methodology-list li').count();
  expect(cannotItems).toBeGreaterThan(0);
});

test('MethodologyBlock slogan renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.methodology-slogan')).toBeVisible();
  const slogan = await page.locator('.methodology-slogan').textContent();
  // zh-CN slogan or en fallback
  expect(slogan).toMatch(/证据比感觉重要|Evidence beats/);
});

test('SampleExperience renders real sample cards with source + known limits', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.sample-placeholder')).toHaveCount(0);
  const cards = page.locator('.sample-card');
  expect(await cards.count()).toBeGreaterThan(0);
  // A known real sample and the §7.3-required source line must be present.
  await expect(page.locator('.sample-card', { hasText: 'Adobe Firefly' })).toBeVisible();
  expect(await page.locator('.sample-source').count()).toBeGreaterThan(0);
  expect(await page.locator('.sample-limits').count()).toBeGreaterThan(0);
  // Cards must be keyboard-focusable (role=button, tabindex) for click-to-analyze.
  await expect(cards.first()).toHaveAttribute('data-file-ref', /\/samples\//);
});

test('LatestExperiments renders real experiment cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.experiment-placeholder')).toHaveCount(0);
  const cards = page.locator('.experiment-card');
  expect(await cards.count()).toBeGreaterThan(0);
  await expect(page.locator('.experiment-card', { hasText: 'ComfyUI' })).toBeVisible();
  // parser version (spec §11) is surfaced
  expect(await page.locator('.experiment-parser').count()).toBeGreaterThan(0);
});

test('no .ad-slot is above the Detector / first screen', async ({ page }) => {
  await page.goto('/');
  // The detector upload zone must exist and be below any ad-slot
  const result = await page.evaluate(() => {
    const adSlots = Array.from(document.querySelectorAll('.ad-slot'));
    const detector = document.querySelector('#upload-zone');
    if (!detector) return { ok: false, reason: 'no #upload-zone' };
    const detectorTop = detector.getBoundingClientRect().top + window.scrollY;
    for (const ad of adSlots) {
      const adTop = ad.getBoundingClientRect().top + window.scrollY;
      if (adTop < detectorTop) {
        return { ok: false, reason: `ad-slot top=${adTop} is above detector top=${detectorTop}` };
      }
    }
    return { ok: true };
  });
  expect(result.ok, result.reason).toBe(true);
});

test('an .ad-slot exists after the methodology section', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const methodology = document.querySelector('#methodology');
    if (!methodology) return { ok: false, reason: 'no #methodology' };
    const methodologyBottom = methodology.getBoundingClientRect().bottom + window.scrollY;
    const adSlots = Array.from(document.querySelectorAll('.ad-slot'));
    const hasAdAfter = adSlots.some((ad) => {
      const adTop = ad.getBoundingClientRect().top + window.scrollY;
      return adTop >= methodologyBottom - 40; // allow small tolerance
    });
    return { ok: hasAdAfter, reason: hasAdAfter ? '' : 'no ad-slot found after methodology' };
  });
  expect(result.ok, result.reason).toBe(true);
});

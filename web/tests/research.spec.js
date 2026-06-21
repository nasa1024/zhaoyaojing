import { test, expect } from '@playwright/test';

test('/research/ lists reproducible experiments', async ({ page }) => {
  await page.goto('/research/');
  await expect(page.locator('h1')).toHaveText('Research Center');
  await expect(page.locator('.research-card')).toHaveCount(5);
  await expect(page.locator('a[href="/research/firefly-jpeg-2026-06/"]')).toHaveCount(2);
  await expect(page.locator('dt', { hasText: 'Parser' })).toHaveCount(5);
  await expect(page.locator('dt', { hasText: 'License' })).toHaveCount(5);
});

test('research detail pages expose PRD evidence fields and links back to tools/pages', async ({ page }) => {
  await page.goto('/research/comfyui-sdxl-png-2026-06/');
  await expect(page.locator('h1')).toContainText('ComfyUI');
  for (const heading of ['Experiment Summary', 'Expected Signals', 'Actual Signals', 'Misses', 'Limitations', 'Reproducible Steps', 'Sample Provenance', 'Related Tools And Pages']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await expect(page.getByText('Browser/system')).toBeVisible();
  await expect(page.locator('a[href="/platforms/comfyui/"]')).toHaveCount(1);
  await expect(page.locator('a[href="/tools/png-parameter-extractor/"]')).toHaveCount(1);
  await expect(page.locator('a[href="/samples/generation-parameters.png"]')).toHaveCount(1);
});

test('home experiment cards link to internal research notes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#latest-experiments a[href^="/research/"]')).toHaveCount(5);
});

test('research pages appear in the sitemap', async ({ request }) => {
  const res = await request.get('/sitemap-0.xml');
  expect(res.ok()).toBeTruthy();
  const text = await res.text();
  expect(text).toContain('https://www.aicheck365.com/research/');
  expect(text).toContain('https://www.aicheck365.com/research/comfyui-sdxl-png-2026-06/');
});

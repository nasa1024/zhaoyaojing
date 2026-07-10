import { test, expect } from '@playwright/test';

test('/research/ lists reproducible experiments', async ({ page }) => {
  await page.goto('/research/');
  await expect(page.locator('h1')).toHaveText('Research Center');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.research-card')).toHaveCount(5);
  await expect(page.locator('a[href="/research/firefly-jpeg-2026-06/"]')).toHaveCount(3);
  await expect(page.locator('dt', { hasText: 'Parser' })).toHaveCount(5);
  await expect(page.locator('dt', { hasText: 'License' })).toHaveCount(5);
  await expect(page.locator('a[href="/research/ai-media-provenance-report-2026-q3/"]')).toBeVisible();
});

test('research detail pages expose PRD evidence fields and links back to tools/pages', async ({ page }) => {
  await page.goto('/research/comfyui-sdxl-png-2026-06/');
  await expect(page.locator('h1')).toContainText('ComfyUI');
  for (const heading of ['What did this experiment find?', 'Experiment Summary', 'Source, license, and authorship', 'Expected Signals', 'Actual Signals', 'Misses', 'Limitations', 'Reproducible Steps', 'Sample Provenance', 'Related Tools and Platform Guides', 'Sources']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await expect(page.getByText('Browser/system')).toBeVisible();
  await expect(page.locator('a[href="/en/platforms/comfyui/"]')).toHaveCount(1);
  await expect(page.locator('a[href="/en/tools/png-parameter-extractor/"]')).toHaveCount(2);
  await expect(page.locator('a[href="/samples/generation-parameters.png"]')).toHaveCount(2);
});

test('quarterly provenance report is transparent and data-backed', async ({ page }) => {
  await page.goto('/research/ai-media-provenance-report-2026-q3/');
  await expect(page.locator('h1')).toHaveText('AI Media Provenance Report, 2026 Q3');
  await expect(page.getByText('5', { exact: true })).toHaveCount(1);
  await expect(page.getByText('6', { exact: true })).toHaveCount(1);
  await expect(page.locator('.comparison-table tbody tr')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: 'What this report cannot support' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Suggested citation' })).toBeVisible();
  await expect(page.locator('a[href="/data/experiments.json"]')).toHaveCount(3);
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
  expect(text).toContain('https://www.aicheck365.com/research/ai-media-provenance-report-2026-q3/');
  expect(text).toContain('https://www.aicheck365.com/research/comfyui-sdxl-png-2026-06/');
});

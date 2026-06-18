import { test, expect } from '@playwright/test';

// End-to-end: clicking a real sample card loads the bundled file, runs the real
// wasm engine (production path), and renders an evidence result. Uses the
// Adobe Firefly sample, which carries valid AI Content Credentials (state A).
test('clicking a sample card analyzes the real file and renders a result', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/');

  const card = page.locator('.sample-card', { hasText: 'Adobe Firefly' });
  await expect(card).toBeVisible();
  await card.click();

  // Engine loads (~9MB wasm) then renders the conclusion summary.
  const summary = page.locator('.evidence-summary');
  await expect(summary).toBeVisible({ timeout: 80000 });
  await expect(page.locator('.case-file-name')).toContainText('firefly-valid-c2pa');
  // A semantic evidence badge is shown.
  await expect(summary.locator('.sig').first()).toBeVisible();
});

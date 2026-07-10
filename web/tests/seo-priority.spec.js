import { test, expect } from '@playwright/test';

test('English Sora page has an archival provenance profile and tool CTA', async ({ page }) => {
  await page.goto('/en/platforms/sora/');
  await expect(page.locator('.priority-seo-page')).toHaveAttribute('data-priority-page', 'platforms/sora');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Sora provenance checks');
  await expect(page.locator('.lead-text')).toContainText('original MP4 or MOV');
  await expect(page.getByText('Sora regression fixtures')).toBeVisible();
  await expect(page.locator('a[href="/en/tools/mp4-metadata-inspector/"]')).toBeVisible();
});

test('English Gemini page targets C2PA intent with sample-status honesty', async ({ page }) => {
  await page.goto('/en/platforms/gemini/');
  await expect(page.locator('.priority-seo-page')).toHaveAttribute('data-priority-page', 'platforms/gemini');
  await expect(page.locator('h1')).toContainText('Gemini C2PA checker');
  await expect(page.getByText('Bundled Gemini image sample')).toBeVisible();
  await expect(page.locator('.priority-seo-page').getByText('digitalSourceType = trainedAlgorithmicMedia').first()).toBeVisible();
  await expect(page.locator('a[href="/en/tools/c2pa-validator/"]')).toBeVisible();
});

test('English ComfyUI page owns the comfyui exif intent without pretending it is camera EXIF', async ({ page }) => {
  await page.goto('/en/platforms/comfyui/');
  await expect(page.locator('.priority-seo-page')).toHaveAttribute('data-priority-page', 'platforms/comfyui');
  await expect(page.locator('h1')).toContainText('ComfyUI EXIF');
  await expect(page.locator('.lead-text')).toContainText('not camera EXIF');
  await expect(page.getByText('ComfyUI / Stable Diffusion XL PNG')).toBeVisible();
  await expect(page.locator('a[href="/en/tools/png-parameter-extractor/"]')).toBeVisible();
});

test('German video page targets videoerkennung and keeps unavailable tool locales root-only', async ({ page }) => {
  await page.goto('/de/blog/how-to-detect-ai-videos/');
  await expect(page.locator('.priority-seo-page')).toHaveAttribute('data-priority-page', 'blog/how-to-detect-ai-videos');
  await expect(page.locator('h1')).toContainText('Videoerkennung');
  await expect(page.getByText('Google Veo MP4')).toBeVisible();
  await expect(page.locator('a[href="/tools/mp4-metadata-inspector/"]')).toBeVisible();
  await expect(page.locator('a[href="/de/tools/mp4-metadata-inspector/"]')).toHaveCount(0);
});

test('Brazilian Portuguese AI image page has local-language sample-backed content', async ({ page }) => {
  await page.goto('/pt-BR/blog/how-to-detect-ai-images/');
  await expect(page.locator('.priority-seo-page')).toHaveAttribute('data-priority-page', 'blog/how-to-detect-ai-images');
  await expect(page.locator('h1')).toHaveText('Como identificar imagens geradas por IA em 2026');
  await expect(page.getByText('Adobe Firefly JPEG')).toBeVisible();
  await expect(page.getByText('ComfyUI / Stable Diffusion XL PNG')).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /parâmetros PNG/);
  await expect(page.locator('a[href="/tools/exif-xmp-reader/"]')).toBeVisible();
  await expect(page.locator('a[href="/pt-BR/tools/exif-xmp-reader/"]')).toHaveCount(0);
});

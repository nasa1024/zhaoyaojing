import { test, expect } from '@playwright/test';

const guideCases = [
  {
    path: '/en/platforms/comfyui/',
    intent: 'informational-guide',
    title: 'ComfyUI EXIF and Metadata Viewer',
    h1: 'ComfyUI EXIF Explained',
    marker: 'ComfyUI / Stable Diffusion XL PNG',
    toolHref: '/en/tools/png-parameter-extractor/',
  },
  {
    path: '/en/platforms/stable-diffusion/',
    intent: 'informational-guide',
    title: 'Stable Diffusion PNG Info',
    h1: 'Stable Diffusion PNG Info Explained',
    marker: 'AUTOMATIC1111 / A1111',
    toolHref: '/en/tools/png-parameter-extractor/',
  },
  {
    path: '/en/platforms/firefly/',
    intent: 'verification-guide',
    title: 'Adobe Firefly Content Credentials',
    h1: 'Adobe Firefly C2PA Checker',
    marker: 'Adobe Firefly JPEG',
    toolHref: '/en/tools/c2pa-validator/',
  },
];

test('English opportunity pages are static guides with a single explicit tool owner', async ({ page }) => {
  for (const item of guideCases) {
    await page.goto(item.path);

    await expect(page).toHaveTitle(new RegExp(item.title));
    await expect(page.locator('.priority-seo-page')).toHaveAttribute('data-seo-intent', item.intent);
    await expect(page.locator('h1')).toContainText(item.h1);
    await expect(page.getByText(item.marker, { exact: false }).first()).toBeVisible();
    await expect(page.locator(`a[href="${item.toolHref}"]`).first()).toBeVisible();
    await expect(page.locator('#tool-file-input')).toHaveCount(0);
    await expect(page.locator('h1')).toHaveCount(1);
  }
});

test('ComfyUI guide answers the storage question instead of acting like the upload tool', async ({ page }) => {
  await page.goto('/en/platforms/comfyui/');

  await expect(page.locator('.lead-text')).toContainText('not camera EXIF');
  await expect(page.getByRole('heading', { name: 'Guide page or extraction tool?' })).toBeVisible();
  await expect(page.getByText('prompt and workflow PNG chunks', { exact: false })).toBeVisible();
  await expect(page.locator('a[href="/en/tools/png-parameter-extractor/"]').first()).toContainText('Extract');
});

test('Stable Diffusion guide separates A1111 parameters from ComfyUI workflow JSON', async ({ page }) => {
  await page.goto('/en/platforms/stable-diffusion/');

  await expect(page.getByText('parameters key', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('prompt and workflow keys', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('NovelAI', { exact: false }).first()).toBeVisible();
});

test('Firefly page exposes the verification promise and real-sample status above the fold', async ({ page }) => {
  await page.goto('/en/platforms/firefly/');

  await expect(page.locator('.article-meta')).toContainText('Free · No sign-up · Local browser verification');
  await expect(page.getByText('valid rather than trusted', { exact: false }).first()).toBeVisible();
  await expect(page.locator('a[href="/en/tools/c2pa-validator/"]').first()).toContainText('Check');
});

test('PNG Parameter Extractor owns the transactional upload intent', async ({ page }) => {
  await page.goto('/en/tools/png-parameter-extractor/');

  await expect(page).toHaveTitle('PNG Parameter Extractor: ComfyUI, A1111 & NovelAI | AICheck365');
  await expect(page.locator('.priority-seo-page')).toHaveAttribute('data-seo-intent', 'transactional-tool');
  await expect(page.locator('.priority-seo-page')).toHaveAttribute('data-tool-owner', 'png-parameter-extractor');
  await expect(page.locator('h1')).toHaveText('PNG Parameter Extractor for ComfyUI, A1111 and NovelAI');
  await expect(page.locator('#tool-file-input')).toHaveAttribute('accept', /png/);
  await expect(page.locator('#tool-filter')).toBeVisible();
  await expect(page.locator('#tool-copy')).toBeVisible();
  await expect(page.locator('#tool-export')).toBeVisible();
  await expect(page.locator('a[href="/en/platforms/comfyui/"]').first()).toBeVisible();
  await expect(page.locator('a[href="/en/platforms/stable-diffusion/"]').first()).toBeVisible();
});

test('intent pages are present in the initial server-rendered HTML', async ({ request }) => {
  const expected = [
    ['/en/platforms/comfyui/', 'data-seo-intent="informational-guide"', 'ComfyUI EXIF Explained'],
    ['/en/platforms/stable-diffusion/', 'data-seo-intent="informational-guide"', 'Stable Diffusion PNG Info Explained'],
    ['/en/platforms/firefly/', 'data-seo-intent="verification-guide"', 'Adobe Firefly C2PA Checker'],
    ['/en/tools/png-parameter-extractor/', 'data-seo-intent="transactional-tool"', 'PNG Parameter Extractor for ComfyUI'],
  ];

  for (const [pathname, intentMarkup, h1] of expected) {
    const response = await request.get(pathname);
    expect(response.ok(), pathname).toBeTruthy();
    const html = await response.text();
    expect(html, pathname).toContain(intentMarkup);
    expect(html, pathname).toContain(h1);
  }
});

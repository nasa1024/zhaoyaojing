import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE = path.join(__dirname, '../public/samples/verified-ai-credentials.jpg');
const EXPIRED_SAMPLE = path.join(__dirname, '../public/samples/expired-credentials.png');
const TAMPERED_SAMPLE = path.join(__dirname, '../public/samples/tampered-signature.jpg');
const NO_MANIFEST_SAMPLE = path.join(__dirname, '../public/samples/screenshot-no-metadata.jpg');
const PNG_SAMPLE = path.join(__dirname, '../public/samples/generation-parameters.png');
const MP4_SAMPLE = path.join(__dirname, '../public/samples/signed-video.mp4');
const TOOL_ROUTES = [
  '/tools/c2pa-validator/',
  '/tools/exif-xmp-reader/',
  '/tools/png-parameter-extractor/',
  '/tools/mp4-metadata-inspector/',
];
const EN_TOOL_ROUTES = TOOL_ROUTES.map((route) => `/en${route}`);

async function analyzeC2paFixture(page, sample) {
  await page.goto('/en/tools/c2pa-validator/');
  await page.locator('#tool-file-input').setInputFiles(sample);
  const out = page.locator('#tool-output');
  await expect(out).toBeVisible({ timeout: 80000 });
  await page.waitForFunction(() => Boolean(window.__AICHECK_TOOL_LAST__?.state));
  return out;
}

async function expectAnyVisibleText(locator, terms) {
  const text = await locator.innerText();
  expect(
    terms.some((term) => text.includes(term)),
    `Expected one of ${terms.join(' | ')} in output:\n${text.slice(0, 2000)}`
  ).toBeTruthy();
}

test('header exposes a Tools nav link to /tools/', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('.site-nav a[data-i18n="nav.tools"]');
  await expect(link).toHaveAttribute('href', '/tools/');
  await expect(link).toHaveText('工具');
});

test('Tools nav link points to the localized English tools hub', async ({ page }) => {
  await page.goto('/en/');
  const link = page.locator('.site-nav a[data-i18n="nav.tools"]');
  await expect(link).toHaveAttribute('href', '/en/tools/');
  await expect(link).toHaveText('Tools');
});

test('Tools nav link stays root-only for locales without tool translations yet', async ({ page }) => {
  await page.goto('/es/');
  const link = page.locator('.site-nav a[data-i18n="nav.tools"]');
  await expect(link).toHaveAttribute('href', '/tools/');
  await expect(link).toHaveAttribute('data-no-localize', 'true');
  await expect(link).toHaveText('Herramientas');
});

test('C2PA tool body copy is server-rendered (works with JS disabled)', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/tools/c2pa-validator/');
  await expect(page.locator('h1')).toContainText('C2PA');
  await expect(page.getByText('如何使用')).toBeVisible();
  await expect(page.getByText('字段含义')).toBeVisible();
  await expect(page.locator('dl.faq-list dt')).toHaveCount(3);
  await ctx.close();
});

test('English C2PA tool body copy is server-rendered at the localized URL', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/en/tools/c2pa-validator/');
  await expect(page.locator('h1')).toContainText('C2PA Validator');
  await expect(page.getByText('How to use')).toBeVisible();
  await expect(page.getByText('Field meanings')).toBeVisible();
  await expect(page.locator('dl.faq-list dt')).toHaveCount(3);
  await ctx.close();
});

test('all PRD tool pages are server-rendered and reachable without JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  for (const route of TOOL_ROUTES.slice(1)) {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#tool-inspector')).toBeVisible();
    await expect(page.getByText('如何使用')).toBeVisible();
    await expect(page.locator('dl.faq-list dt')).toHaveCount(3);
  }
  await ctx.close();
});

test('tools hub links every live PRD tool', async ({ page }) => {
  await page.goto('/tools/');
  for (const route of TOOL_ROUTES) {
    await expect(page.locator(`.tool-hub-card[href="${route}"]`)).toHaveCount(1);
  }
  await expect(page.getByText('即将上线')).toHaveCount(0);

  await page.goto('/en/tools/');
  for (const route of EN_TOOL_ROUTES) {
    await expect(page.locator(`.tool-hub-card[href="${route}"]`)).toHaveCount(1);
  }
  await expect(page.getByText('Coming soon')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveText('Detection Tools');
});

test('C2PA tool does not load the wasm engine until a file is analyzed', async ({ page }) => {
  const wasmRequests = [];
  page.on('request', (r) => { if (r.url().includes('/pkg/aicheck')) wasmRequests.push(r.url()); });
  await page.goto('/tools/c2pa-validator/');
  await page.waitForTimeout(500);
  expect(wasmRequests).toHaveLength(0);
});

test('C2PA tool analyzes a real signed sample and shows raw provenance', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/tools/c2pa-validator/');
  await page.locator('#tool-file-input').setInputFiles(SAMPLE);
  const out = page.locator('#tool-output');
  await expect(out).toBeVisible({ timeout: 80000 });
  // Real engine output: a non-unsigned state badge and the raw manifest JSON.
  await expect(out.locator('.tool-raw-badge')).toContainText('valid');
  await expect(out.locator('.tool-raw-json')).toBeVisible();
  // Truthfulness/export: the last raw report is the exact engine return.
  const state = await page.evaluate(() => window.__AICHECK_TOOL_LAST__?.state);
  expect(['valid', 'trusted', 'invalid']).toContain(state);
});

test('C2PA tool separates signature validity, trust, tamper, expiry, and no-manifest states', async ({ page }) => {
  test.setTimeout(180000);
  const cases = [
    {
      sample: SAMPLE,
      expectedStates: ['valid', 'trusted'],
      expectedText: ['Status summary', 'Manifest', 'Found', 'Signature validity', 'Cryptographically valid', 'Trust status'],
      anyText: ['Signature valid, signer not trusted here', 'Signer trusted by this engine'],
    },
    {
      sample: EXPIRED_SAMPLE,
      expectedStates: ['invalid'],
      expectedText: ['Status summary', 'Signature validity', 'Invalid or unverifiable', 'Problem summary'],
      anyText: ['Certificate expired', 'Signer is not in the trust list', 'Signature validation issue'],
    },
    {
      sample: TAMPERED_SAMPLE,
      expectedStates: ['invalid'],
      expectedText: ['Status summary', 'Signature validity', 'Invalid or unverifiable', 'Problem summary'],
      anyText: ['Content hash mismatch', 'Signature validation issue'],
    },
    {
      sample: NO_MANIFEST_SAMPLE,
      expectedStates: ['unsigned'],
      expectedText: ['Status summary', 'Manifest', 'Not found', 'Signature validity', 'No C2PA signature found', 'Problem summary', 'No readable C2PA manifest', 'No C2PA manifest found in this file.'],
    },
  ];

  for (const c of cases) {
    const out = await analyzeC2paFixture(page, c.sample);
    const report = await page.evaluate(() => window.__AICHECK_TOOL_LAST__);
    expect(c.expectedStates).toContain(report.state);
    for (const text of c.expectedText) {
      await expect(out).toContainText(text);
    }
    if (c.anyText) {
      await expectAnyVisibleText(out, c.anyText);
    }
  }
});

test('new PRD metadata tools analyze real local samples', async ({ page }) => {
  test.setTimeout(90000);
  const cases = [
    ['/tools/exif-xmp-reader/', SAMPLE, 'EXIF/XMP'],
    ['/tools/png-parameter-extractor/', PNG_SAMPLE, 'PNG'],
    ['/tools/mp4-metadata-inspector/', MP4_SAMPLE, 'MP4'],
  ];

  for (const [route, sample, expectedText] of cases) {
    await page.goto(route);
    await page.locator('#tool-file-input').setInputFiles(sample);
    const out = page.locator('#tool-output');
    await expect(out).toBeVisible({ timeout: 80000 });
    await expect(out).toContainText(expectedText);
    const tool = await page.evaluate(() => window.__AICHECK_TOOL_LAST__?.tool);
    expect(tool).toBeTruthy();
  }
});

test('C2PA tool is distinct from the homepage verdict UI (no A/B/C/D verdict)', async ({ page }) => {
  await page.goto('/tools/c2pa-validator/');
  await page.locator('#tool-file-input').setInputFiles(SAMPLE);
  await expect(page.locator('#tool-output')).toBeVisible({ timeout: 80000 });
  await expect(page.locator('.evidence-summary')).toHaveCount(0);
  await expect(page.getByText('检测到 AI 来源信号')).toHaveCount(0);
});

test('tool routes appear in the sitemap', async ({ request }) => {
  const urlset = await request.get('/sitemap-0.xml');
  expect(urlset.ok()).toBeTruthy();
  const text = await urlset.text();
  expect(text).toContain('https://www.aicheck365.com/tools/');
  for (const route of TOOL_ROUTES) {
    expect(text).toContain(`https://www.aicheck365.com${route}`);
  }
  expect(text).toContain('https://www.aicheck365.com/en/tools/');
  for (const route of EN_TOOL_ROUTES) {
    expect(text).toContain(`https://www.aicheck365.com${route}`);
  }
  expect(text).not.toContain('https://www.aicheck365.com/es/tools/');
});

test('tool pages emit only the available zh-CN and en hreflang alternates', async ({ page }) => {
  for (const route of TOOL_ROUTES) {
    await page.goto(route);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com${route}`
    );
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com${route}`
    );
    await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com${route}`
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com/en${route}`
    );
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveCount(0);

    await page.goto(`/en${route}`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com/en${route}`
    );
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
    await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com${route}`
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href', `https://www.aicheck365.com/en${route}`
    );
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveCount(0);
  }
});

test('language switch keeps supported tool paths and avoids unsupported tool locales', async ({ page }) => {
  await page.goto('/tools/exif-xmp-reader/');
  await page.locator('#lang-switch').selectOption('en');
  await page.waitForURL('/en/tools/exif-xmp-reader/');
  await expect(page.locator('h1')).toHaveText('EXIF/XMP Reader');

  await page.locator('#lang-switch').selectOption('es');
  await page.waitForURL('/es/');
  await expect(page.locator('.site-nav a[data-i18n="nav.tools"]')).toHaveAttribute('href', '/tools/');
});

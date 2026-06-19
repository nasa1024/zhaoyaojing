import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE = path.join(__dirname, '../public/samples/verified-ai-credentials.jpg');

test('header exposes a Tools nav link to /tools/', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('.site-nav a[data-i18n="nav.tools"]');
  await expect(link).toHaveAttribute('href', '/tools/');
  await expect(link).toHaveText('工具');
});

test('Tools nav link stays unprefixed on a localized page (root-only tool routes)', async ({ page }) => {
  await page.goto('/en/');
  const link = page.locator('.site-nav a[data-i18n="nav.tools"]');
  // Tool pages are root-only; the link must NOT become /en/tools/ (which would 404).
  await expect(link).toHaveAttribute('href', '/tools/');
  await expect(link).toHaveText('Tools');
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
  expect(text).toContain('https://www.aicheck365.com/tools/c2pa-validator/');
});

test('single-language tool page emits no localized hreflang alternates', async ({ page }) => {
  await page.goto('/tools/c2pa-validator/');
  const alts = page.locator('link[rel="alternate"][hreflang]');
  await expect(alts).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href', 'https://www.aicheck365.com/tools/c2pa-validator/'
  );
});

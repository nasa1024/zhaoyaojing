import { test, expect, chromium } from '@playwright/test';

test('/methodology/ h1 renders', async ({ page }) => {
  await page.goto('/methodology/');
  const h1 = page.locator('h1');
  await expect(h1).toBeVisible();
  const h1Text = await h1.textContent();
  // zh-CN default: 方法论; could also be English if served differently
  expect(h1Text).toMatch(/方法论|Methodology/i);
});

test('/methodology/ "不能保证" / "cannot guarantee" section renders', async ({ page }) => {
  await page.goto('/methodology/');
  // The cannot column should be visible
  const cannotSection = page.locator('.methodology-col--cannot');
  await expect(cannotSection).toBeVisible();
  // Should have list items
  const items = cannotSection.locator('li');
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
});

test('/methodology/ slogan renders', async ({ page }) => {
  await page.goto('/methodology/');
  const slogan = page.locator('.methodology-slogan');
  await expect(slogan).toBeVisible();
  const text = await slogan.textContent();
  expect(text).toMatch(/证据比感觉重要|Evidence beats/);
});

test('/methodology/ page content is visible with JavaScript DISABLED (SSR)', async ({ browser }) => {
  const noJsContext = await browser.newContext({ javaScriptEnabled: false });
  const page = await noJsContext.newPage();
  await page.goto('/methodology/');

  // h1 must be present without JS
  const h1 = page.locator('h1');
  await expect(h1).toBeVisible();
  const h1Text = await h1.textContent();
  expect(h1Text).toMatch(/方法论|Methodology/i);

  // cannot section must be present without JS
  const cannotSection = page.locator('.methodology-col--cannot');
  await expect(cannotSection).toBeVisible();

  // slogan must be present without JS
  const slogan = page.locator('.methodology-slogan');
  await expect(slogan).toBeVisible();

  await noJsContext.close();
});

test('nav contains a Methodology link', async ({ page }) => {
  await page.goto('/methodology/');
  // Desktop nav or mobile menu should have a link to /methodology/
  const navLink = page.locator('a[href*="/methodology/"]').first();
  await expect(navLink).toBeAttached();
});

test('/methodology/ can-check section renders', async ({ page }) => {
  await page.goto('/methodology/');
  const canSection = page.locator('.methodology-col--can');
  await expect(canSection).toBeVisible();
  const items = canSection.locator('li');
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
});

test('/methodology/ links to /privacy/ and /platforms/', async ({ page }) => {
  await page.goto('/methodology/');
  const privacyLink = page.locator('a[href*="/privacy/"]').first();
  const platformsLink = page.locator('a[href*="/platforms/"]').first();
  await expect(privacyLink).toBeAttached();
  await expect(platformsLink).toBeAttached();
});

import { test, expect } from '@playwright/test';

// Minimal fake report for driving render.js
const fakeReport = {
  file_name: 'test.jpg',
  mime_type: 'image/jpeg',
  media_type: 'image',
  mode: 'browser-image',
  signals: [
    { source: 'EXIF', confidence: 'low', tool: null, description: 'EXIF Software = TestTool', details: [] },
  ],
  provenance: { state: 'unsigned', manifest: null },
  limitations: [],
};

// Stub window.gtag before page load so every ga() call is recorded
async function installGtagStub(page) {
  await page.addInitScript(() => {
    window.__ga_calls__ = [];
    window.gtag = function(type, name, params) {
      window.__ga_calls__.push({ type, name, params: params || {} });
    };
  });
}

function getAllRecordedEvents(page) {
  return page.evaluate(() => window.__ga_calls__ || []);
}

test('result_status_viewed fires with state letter when renderResult is called', async ({ page }) => {
  await installGtagStub(page);
  await page.goto('/');

  await page.evaluate(async (report) => {
    const mod = await import('/scripts/render.js');
    const el = document.getElementById('report');
    el.classList.remove('hidden');
    mod.renderResult(el, report, { expert: false });
  }, fakeReport);

  const calls = await getAllRecordedEvents(page);
  const viewed = calls.filter(c => c.name === 'result_status_viewed');
  expect(viewed.length).toBeGreaterThan(0);
  const params = viewed[0].params;
  expect(['A', 'B', 'C', 'D']).toContain(params.state);
});

test('expert_mode_enabled fires when renderResult is called with expert:true', async ({ page }) => {
  await installGtagStub(page);
  await page.goto('/');

  await page.evaluate(async (report) => {
    const mod = await import('/scripts/render.js');
    const el = document.getElementById('report');
    el.classList.remove('hidden');
    mod.renderResult(el, report, { expert: true });
  }, fakeReport);

  const calls = await getAllRecordedEvents(page);
  const expertEvents = calls.filter(c => c.name === 'expert_mode_enabled');
  expect(expertEvents.length).toBeGreaterThan(0);
});

test('report_exported fires with correct format when export button is clicked', async ({ page }) => {
  await installGtagStub(page);
  // Stub clipboard to avoid permission errors
  await page.addInitScript(() => {
    navigator.clipboard = { writeText: () => Promise.resolve() };
  });
  await page.goto('/');

  // Mount the receipt widget via renderResult (which calls mountReceipt internally)
  await page.evaluate(async (report) => {
    const mod = await import('/scripts/render.js');
    const el = document.getElementById('report');
    el.classList.remove('hidden');
    mod.renderResult(el, report, { expert: false });
  }, fakeReport);

  // Wait for receipt mount point to appear (async import inside renderResult)
  await page.waitForSelector('#receipt-mount button[data-act]', { timeout: 5000 });

  // Click the text export button
  await page.locator('#receipt-mount button[data-act="text"]').click();

  const calls = await getAllRecordedEvents(page);
  const exported = calls.filter(c => c.name === 'report_exported');
  expect(exported.length).toBeGreaterThan(0);
  const formats = exported.map(c => c.params.format);
  expect(formats).toContain('text');
});

test('report_exported fires with format:json when json button is clicked', async ({ page }) => {
  await installGtagStub(page);
  await page.goto('/');

  await page.evaluate(async (report) => {
    const mod = await import('/scripts/render.js');
    const el = document.getElementById('report');
    el.classList.remove('hidden');
    mod.renderResult(el, report, { expert: false });
  }, fakeReport);

  await page.waitForSelector('#receipt-mount button[data-act="json"]', { timeout: 5000 });
  await page.locator('#receipt-mount button[data-act="json"]').click();

  const calls = await getAllRecordedEvents(page);
  const exported = calls.filter(c => c.name === 'report_exported' && c.params.format === 'json');
  expect(exported.length).toBeGreaterThan(0);
});

test('analytics params contain NO forbidden private keys', async ({ page }) => {
  await installGtagStub(page);
  await page.addInitScript(() => {
    navigator.clipboard = { writeText: () => Promise.resolve() };
  });
  await page.goto('/');

  // Fire result_status_viewed and expert_mode_enabled
  await page.evaluate(async (report) => {
    const mod = await import('/scripts/render.js');
    const el = document.getElementById('report');
    el.classList.remove('hidden');
    mod.renderResult(el, report, { expert: true });
  }, fakeReport);

  await page.waitForSelector('#receipt-mount button[data-act]', { timeout: 5000 });
  await page.locator('#receipt-mount button[data-act="text"]').click();

  const calls = await getAllRecordedEvents(page);
  const forbidden = ['file_name', 'filename', 'file_path', 'filepath', 'gps', 'lat', 'lng',
    'latitude', 'longitude', 'prompt', 'exif', 'hash', 'sha', 'md5'];

  for (const call of calls) {
    const paramKeys = Object.keys(call.params || {}).map(k => k.toLowerCase());
    for (const key of paramKeys) {
      const hasForbidden = forbidden.some(f => key === f || key.includes(f));
      expect(hasForbidden, `Event "${call.name}" has forbidden param key "${key}"`).toBe(false);
    }
  }
});

test('sitemap-0.xml contains methodology and no user/result data', async ({ request }) => {
  const res = await request.get('/sitemap-0.xml');
  expect(res.ok()).toBeTruthy();
  const text = await res.text();

  // methodology page must be indexed
  expect(text).toContain('methodology');

  // These patterns indicate user/result data leaking into sitemap — must not appear
  expect(text).not.toContain('/report/');
  expect(text).not.toContain('/upload/');
  expect(text).not.toContain('/result/');
  expect(text).not.toContain('file_name');
  expect(text).not.toContain('analysis_');
});

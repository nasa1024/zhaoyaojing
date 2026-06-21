import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE = path.join(__dirname, '../public/samples/verified-ai-credentials.jpg');
const PNG_SAMPLE = path.join(__dirname, '../public/samples/generation-parameters.png');
const FORBIDDEN_PARAM_KEYS = [
  'file_name', 'filename', 'file_path', 'filepath', 'gps', 'lat', 'lng',
  'latitude', 'longitude', 'prompt', 'exif', 'hash', 'sha', 'md5', 'serial',
  'certificate', 'raw_json', 'metadata_value',
];
const TOOL_EVENT_ALLOWED_PARAMS = {
  detector_view: ['locale', 'page_type', 'tool_type'],
  file_select: ['file_category', 'mime_group', 'file_count_bucket'],
  analysis_start: ['tool_type'],
  analysis_complete: ['result_category', 'duration_bucket', 'file_category'],
  analysis_error: ['sanitized_error_code', 'file_category'],
  copy_result: ['copy_type'],
  export_result: ['export_type'],
};

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

function assertNoForbiddenAnalyticsParams(calls) {
  for (const call of calls) {
    const paramKeys = Object.keys(call.params || {}).map(k => k.toLowerCase());
    for (const key of paramKeys) {
      const hasForbidden = FORBIDDEN_PARAM_KEYS.some(f => key === f || key.includes(f));
      expect(hasForbidden, `Event "${call.name}" has forbidden param key "${key}"`).toBe(false);
    }
  }
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
  assertNoForbiddenAnalyticsParams(calls);
});

test('tool page analytics follows the PRD allowlist and keeps file data private', async ({ page }) => {
  test.setTimeout(90000);
  await installGtagStub(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
    window.confirm = () => true;
  });
  await page.goto('/en/tools/png-parameter-extractor/');
  await page.waitForFunction(() => window.__ga_calls__?.some((c) => c.name === 'detector_view'));

  await page.locator('#tool-file-input').setInputFiles(PNG_SAMPLE);
  await expect(page.locator('#tool-output')).toBeVisible({ timeout: 80000 });
  await page.locator('#tool-copy').click();
  await page.waitForFunction(() => window.__ga_calls__?.some((c) => c.name === 'copy_result'), null, { timeout: 5000 });
  await page.locator('#tool-export').click();
  await page.waitForFunction(() => window.__ga_calls__?.some((c) => c.name === 'export_result'), null, { timeout: 5000 });

  const calls = await getAllRecordedEvents(page);
  const toolCalls = calls.filter((c) => Object.prototype.hasOwnProperty.call(TOOL_EVENT_ALLOWED_PARAMS, c.name));
  const names = toolCalls.map((c) => c.name);
  for (const eventName of ['detector_view', 'file_select', 'analysis_start', 'analysis_complete', 'copy_result', 'export_result']) {
    expect(names).toContain(eventName);
  }

  for (const call of toolCalls) {
    const allowed = TOOL_EVENT_ALLOWED_PARAMS[call.name];
    const actual = Object.keys(call.params || {}).sort();
    expect(actual, `Unexpected params for ${call.name}`).toEqual([...allowed].sort());
  }

  const selected = toolCalls.find((c) => c.name === 'file_select');
  expect(selected.params).toEqual({ file_category: 'image', mime_group: 'image', file_count_bucket: '1' });
  const completed = toolCalls.find((c) => c.name === 'analysis_complete');
  expect(completed.params.result_category).toBe('signals_found');

  assertNoForbiddenAnalyticsParams(toolCalls);
  const payloadText = JSON.stringify(toolCalls.map((c) => c.params)).toLowerCase();
  expect(payloadText).not.toContain('generation-parameters');
  expect(payloadText).not.toContain('workflow');
  expect(payloadText).not.toContain('prompt');
  expect(payloadText).not.toContain('raw');
});

test('upload_started fires when a file is selected on the home detector', async ({ page }) => {
  await installGtagStub(page);
  await page.goto('/');
  await page.locator('#file-input').setInputFiles(SAMPLE);
  const calls = await getAllRecordedEvents(page);
  const started = calls.filter((c) => c.name === 'upload_started');
  expect(started.length).toBeGreaterThan(0);
  expect(started[0].params.source).toBe('picker');
});

test('evidence_card_expanded fires when a card is toggled back open', async ({ page }) => {
  await installGtagStub(page);
  await page.goto('/');
  // A non-editing signal renders as an Evidence Card (editing-software signals
  // go to propagation clues instead).
  const report = {
    file_name: 'x.png', mime_type: 'image/png', media_type: 'image',
    signals: [{ source: 'XMP', confidence: 'medium', tool: 'Imagen', description: 'AISystemUsed = Imagen', details: [{ key: 'xmp:AISystemUsed', value: 'Imagen' }] }],
    provenance: { state: 'unsigned', manifest: null }, limitations: [],
  };
  await page.evaluate(async (r) => {
    const mod = await import('/scripts/render.js');
    const el = document.getElementById('report');
    el.classList.remove('hidden');
    mod.renderResult(el, r, { expert: false });
  }, report);
  const card = page.locator('details.evidence-card').first();
  await expect(card).toHaveCount(1);
  // Collapse then expand → the expand fires the event (no event on initial open render).
  await card.locator('summary').click();
  await card.locator('summary').click();
  const calls = await getAllRecordedEvents(page);
  expect(calls.filter((c) => c.name === 'evidence_card_expanded').length).toBeGreaterThan(0);
});

test('platform_page_clicked and related_guide_clicked fire from the related-links nav', async ({ page }) => {
  await installGtagStub(page);
  await page.goto('/');
  await page.evaluate(async (r) => {
    const mod = await import('/scripts/render.js');
    const el = document.getElementById('report');
    el.classList.remove('hidden');
    mod.renderResult(el, r, { expert: false });
    // Click platform + guide links without navigating away.
    const click = (sel) => {
      const a = document.querySelector(sel);
      if (!a) return;
      a.addEventListener('click', (e) => e.preventDefault(), { once: true });
      a.click();
    };
    click('#related-links a[href*="/platforms/"]');
    click('#related-links a[href*="/blog/"]');
  }, { file_name: 'x.jpg', mime_type: 'image/jpeg', media_type: 'image', signals: [], provenance: { state: 'unsigned', manifest: null }, limitations: [] });
  const calls = await getAllRecordedEvents(page);
  expect(calls.filter((c) => c.name === 'platform_page_clicked').length).toBeGreaterThan(0);
  expect(calls.filter((c) => c.name === 'related_guide_clicked').length).toBeGreaterThan(0);
});

test('ad_viewable fires when a reserved ad slot scrolls into view', async ({ page }) => {
  await installGtagStub(page);
  await page.goto('/');
  await page.locator('.ad-slot').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const calls = await getAllRecordedEvents(page);
  expect(calls.filter((c) => c.name === 'ad_viewable').length).toBeGreaterThan(0);
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

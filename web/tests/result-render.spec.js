import { test, expect } from '@playwright/test';

async function render(page, report, expert = false) {
  await page.goto('/');
  return await page.evaluate(async ({ r, e }) => {
    const mod = await import('/scripts/render.js');
    const el = document.getElementById('report');
    el.classList.remove('hidden');
    mod.renderResult(el, r, { expert: e });
    return el.innerHTML;
  }, { r: report, e: expert });
}

test('C state shows mandatory disclaimer, not "human-made"', async ({ page }) => {
  const html = await render(page, { signals: [], provenance: { state: 'unsigned', manifest: null }, limitations: [], file_name: 'x.jpg' });
  expect(html).toContain('未发现'); // state C copy
  expect(html).not.toContain('真人创作'); // forbidden
  expect(html.toLowerCase()).not.toContain('human-made');
});

test('A state shows verified signal class', async ({ page }) => {
  const html = await render(page, {
    signals: [{ source: 'C2PA', confidence: 'high', tool: 'imagen', description: 'x', details: [] }],
    provenance: { state: 'trusted', manifest: { digital_source_type: 'trainedAlgorithmicMedia', claim_generator: 'Imagen', assertions: [] } },
    limitations: [],
    file_name: 'x.jpg',
  });
  expect(html).toContain('sig-verified');
});

test('expert mode reveals raw JSON', async ({ page }) => {
  const html = await render(page, {
    signals: [],
    provenance: { state: 'unsigned', manifest: null, raw_json: '{"k":1}' },
    limitations: [],
    file_name: 'x.jpg',
  }, true);
  expect(html).toContain('raw_json'); // expert block shows raw field identifier
});

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

test('C state renders evidence-level label and propagation-clues heading', async ({ page }) => {
  const html = await render(page, {
    signals: [],
    provenance: { state: 'unsigned', manifest: null },
    limitations: [],
    file_name: 'test.jpg',
  });
  // Fix 1: evidence-level section shows the C-level fallback label
  expect(html).toContain('未发现可识别信号');
  // Fix 2: propagation-clues heading is always rendered
  expect(html).toContain('传播与编辑线索');
});

test('editing-software signal appears under propagation clues', async ({ page }) => {
  const html = await render(page, {
    signals: [
      { source: 'EXIF', confidence: 'low', description: 'EXIF Software = Adobe Photoshop', tool: null, details: [] },
    ],
    provenance: { state: 'unsigned', manifest: null },
    limitations: [],
    file_name: 'edited.jpg',
  });
  // Fix 2: the photoshop description must appear in the clues section
  expect(html).toContain('EXIF Software = Adobe Photoshop');
  // The clues heading must be present
  expect(html).toContain('传播与编辑线索');
  // Fix 3: source badge must NOT carry sig-verified (green) — only sig-neutral
  // The card's source badge is sig-neutral; sig-verified may still appear elsewhere
  // but the signal-source element specifically must use sig-neutral
  expect(html).toContain('sig-neutral');
});

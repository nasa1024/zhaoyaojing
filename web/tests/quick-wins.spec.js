import { test, expect } from '@playwright/test';

// §12: every platform profile must carry the mandatory disclaimer.
test('platform page shows the §12 mandatory disclaimer', async ({ page }) => {
  await page.goto('/platforms/firefly/');
  const note = page.locator('.platform-disclaimer');
  await expect(note).toBeVisible();
  expect(await note.textContent()).toContain('不能排除文件由该平台生成');
});

// §7.6: the homepage fingerprint capsules must include Runway, and the link must resolve.
test('PlatformFingerprint includes Runway and the page exists', async ({ page }) => {
  await page.goto('/');
  const cap = page.locator('.platform-capsule', { hasText: 'Runway' });
  await expect(cap).toHaveAttribute('href', /\/platforms\/runway\/$/);
  const resp = await page.request.get('/platforms/runway/');
  expect(resp.ok()).toBeTruthy();
  expect(await resp.text()).toContain('Runway');
});

// §7.3: every sample card shows a processed/unprocessed label (not only when processed).
test('SampleExperience labels both processed and unprocessed samples', async ({ page }) => {
  await page.goto('/');
  const cards = await page.locator('.sample-card').count();
  expect(cards).toBeGreaterThan(0);
  const badges = await page.locator('.sample-card .badge').count();
  expect(badges).toBe(cards);
});

// §19: a no-JS notice must be present for the interactive detector.
test('home page ships a <noscript> detector notice', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('<noscript>');
});

// §16: ad slots must be clearly labeled.
test('ad slots carry a visible label', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('.ad-label').count()).toBeGreaterThan(0);
});

async function renderReport(page, report, expert = false) {
  await page.goto('/');
  return await page.evaluate(async ({ r, e }) => {
    const mod = await import('/scripts/render.js');
    const el = document.getElementById('report');
    el.classList.remove('hidden');
    mod.renderResult(el, r, { expert: e });
    return el.innerHTML;
  }, { r: report, e: expert });
}

// §9.2 (9/10): the result page populates related platform + article links.
test('result page populates #related-links', async ({ page }) => {
  await page.goto('/');
  const count = await page.evaluate(async () => {
    const mod = await import('/scripts/render.js');
    const el = document.getElementById('report');
    el.classList.remove('hidden');
    mod.renderResult(el, {
      signals: [{ source: 'C2PA', confidence: 'high', tool: 'imagen', description: 'x', details: [] }],
      provenance: { state: 'trusted', manifest: { digital_source_type: 'trainedAlgorithmicMedia', claim_generator: 'Imagen' } },
      limitations: [], file_name: 'x.jpg', media_type: 'image',
    }, { expert: false });
    return el.querySelectorAll('#related-links a').length;
  });
  expect(count).toBeGreaterThan(0);
});

// On a prefixed-language route, related links must localize AND the root-only
// methodology page must be linked unprefixed (so it does not 404).
test('related-links stay valid + localized on a prefixed route', async ({ page }) => {
  await page.goto('/en/');
  const res = await page.evaluate(async () => {
    const mod = await import('/scripts/render.js');
    const el = document.getElementById('report');
    el.classList.remove('hidden');
    mod.renderResult(el, {
      signals: [{ source: 'C2PA', confidence: 'high', tool: 'imagen', description: 'x', details: [] }],
      provenance: { state: 'trusted', manifest: { digital_source_type: 'trainedAlgorithmicMedia', claim_generator: 'Imagen' } },
      limitations: [], file_name: 'x.jpg', media_type: 'image',
    }, { expert: false });
    return {
      links: Array.from(el.querySelectorAll('#related-links a')).map((a) => a.getAttribute('href')),
      heading: el.querySelector('#related-links h3')?.textContent || '',
    };
  });
  expect(res.links).toContain('/methodology/');               // root-only, never /en/methodology/
  expect(res.links.some((h) => h.includes('/en/methodology/'))).toBe(false);
  expect(res.links).toContain('/en/platforms/imagen/');       // platform link IS prefixed
  expect(res.links).toContain('/en/blog/how-to-detect-ai-images/');
  expect(res.heading).toBe('Related reading');                // i18n resolved, not Chinese fallback
});

// §9.1 D: failure/conflict reasons (state.js d.conflicts) must be surfaced.
test('state D surfaces conflict detail', async ({ page }) => {
  const html = await renderReport(page, {
    signals: [], provenance: { state: 'invalid', manifest: null, validation_status: [{ code: 'signingCredential.untrusted' }] },
    limitations: [], file_name: 'x.jpg',
  });
  expect(html).toContain('conflict-list');
});

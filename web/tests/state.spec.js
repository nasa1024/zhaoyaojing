import { test, expect } from '@playwright/test';

// 在浏览器上下文里 import ES module 并执行纯函数
async function derive(page, report) {
  return await page.evaluate(async (r) => {
    const mod = await import('/scripts/state.js'); // 构建产物路径
    return mod.deriveEvidenceState(r);
  }, report);
}

test.describe('deriveEvidenceState', () => {
  test('A: trusted provenance with AI source', async ({ page }) => {
    await page.goto('/');
    const r = await derive(page, {
      signals: [{ source:'C2PA', confidence:'high', tool:'imagen', description:'x' }],
      provenance: { state:'trusted', manifest:{ digital_source_type:'trainedAlgorithmicMedia', claim_generator:'Imagen' } },
      limitations: [],
    });
    expect(r.state).toBe('A');
    expect(r.signature).toBe('trusted');
  });

  test('D: invalid signature', async ({ page }) => {
    await page.goto('/');
    const r = await derive(page, {
      signals: [], provenance: { state:'invalid', manifest:null, validation_status:[{code:'signingCredential.untrusted'}] }, limitations: [],
    });
    expect(r.state).toBe('D');
  });

  test('B: unsigned AI metadata', async ({ page }) => {
    await page.goto('/');
    const r = await derive(page, {
      signals: [{ source:'XMP', confidence:'medium', tool:'midjourney', description:'AISystemUsed' }],
      provenance: { state:'unsigned', manifest:null }, limitations: [],
    });
    expect(r.state).toBe('B');
  });

  test('C: no signals', async ({ page }) => {
    await page.goto('/');
    const r = await derive(page, { signals: [], provenance: { state:'unsigned', manifest:null }, limitations: [] });
    expect(r.state).toBe('C');
  });

  test('D: camera EXIF + AI tool conflict', async ({ page }) => {
    await page.goto('/');
    const r = await derive(page, {
      signals: [
        { source:'EXIF', confidence:'low', description:'EXIF Make = Canon', tool:null },
        { source:'XMP', confidence:'medium', description:'AISystemUsed', tool:'dall-e' },
      ],
      provenance: { state:'unsigned', manifest:null }, limitations: [],
    });
    expect(r.state).toBe('D');
  });
});

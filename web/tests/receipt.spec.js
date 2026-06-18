import { test, expect } from '@playwright/test';

async function model(page, report) {
  await page.goto('/');
  return await page.evaluate(async (r) => {
    const m = await import('/scripts/receipt.js');
    const mdl = m.buildReceiptModel(r);
    return { mdl, text: m.receiptToText(mdl), json: m.receiptToJSON(mdl), cite: m.receiptToCitation(mdl) };
  }, report);
}

test('receipt omits raw private data', async ({ page }) => {
  const r = { file_name:'secret.jpg', signals:[{source:'C2PA',confidence:'high',tool:'imagen',description:'d',details:[{key:'GPS',value:'1.23,4.56'}]}],
    provenance:{state:'trusted',manifest:{claim_generator:'Imagen',digital_source_type:'trainedAlgorithmicMedia'}}, limitations:[] };
  const { text, json } = await model(page, r);
  expect(text).not.toContain('1.23,4.56'); // no GPS
  expect(json).not.toContain('1.23,4.56');
  expect(text).toContain('SIGNAL RECEIPT');
  expect(text).toContain('Local browser only');
});

test('receipt JSON is valid and has conclusion', async ({ page }) => {
  const r = { file_name:'x.jpg', signals:[], provenance:{state:'unsigned',manifest:null}, limitations:[] };
  const { json } = await model(page, r);
  const parsed = JSON.parse(json);
  expect(parsed.processing).toBe('Local browser only');
  expect(parsed.conclusion).toBeTruthy();
});

/**
 * i18n-coverage.spec.js
 *
 * Asserts that every critical i18n key added in Phase-1 (result page copy,
 * hero copy, nav.methodology) exists with a non-empty value in all 9 language
 * objects defined in /scripts/i18n.js.
 */
import { test, expect } from '@playwright/test';

const LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR'];

const CRITICAL_KEYS = [
  // Hero
  'hero.h1',
  'hero.lead',
  'hero.privacy',
  'hero.cta.primary',
  'hero.cta.secondary',
  // Nav
  'nav.methodology',
  // Result states
  'result.state.a',
  'result.state.b',
  'result.state.c',
  'result.state.d',
  'result.state.c.note',
  'result.state.d.note',
  // Evidence level
  'result.level',
  'result.level.a',
  'result.level.b',
  'result.level.c',
  'result.level.d',
  // Result sections
  'result.found',
  'result.notfound',
  'result.none',
  'result.allfound',
  'result.limits',
  'result.next',
  'result.clues',
  'result.clues.none',
  'result.expert',
  // Layers
  'layer.c2pa',
  'layer.png',
  'layer.mp4',
  // Next steps C/D (7 items)
  'next.c.0',
  'next.c.1',
  'next.c.2',
  'next.c.3',
  'next.c.4',
  'next.c.5',
  'next.c.6',
  // Next steps A/B (5 items)
  'next.ab.0',
  'next.ab.1',
  'next.ab.2',
  'next.ab.3',
  'next.ab.4',
  // Receipt export buttons (merged via RECEIPT_LABELS)
  'receipt.btn.text',
  'receipt.btn.cite',
  'receipt.btn.json',
  'receipt.btn.png',
  'receipt.btn.print',
];

test('all 9 language objects contain every critical Phase-1 i18n key with a non-empty value', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(({ langs, keys }) => {
    // Access the module-level translations map via a helper script tag
    // We load i18n.js as a module and read its exported `t` function per lang
    const missing = [];
    // i18n.js is loaded by lang-init.js on the page; the translations object
    // is not directly exposed, so we probe via the DOM attribute mechanism:
    // inject a temporary element and set data-i18n, then switch lang and read.
    // Simpler: load the script text and eval the translations map ourselves.
    return missing; // placeholder — actual check below
  }, { langs: LANGS, keys: CRITICAL_KEYS });

  // Load i18n.js content and evaluate translations directly
  const scriptContent = await page.evaluate(async () => {
    const resp = await fetch('/scripts/i18n.js');
    return resp.text();
  });

  // Parse the translations object by executing the module in an isolated context
  const missing = await page.evaluate(
    ({ script, langs, keys }) => {
      // Create a blob URL from the script and dynamically import it
      // Since we cannot use dynamic import in page.evaluate directly,
      // extract the translations map using regex on the raw source.
      // We rely on the fact that each language key appears as 'lang': { ... }
      const missing = [];
      try {
        // Use Function constructor to capture translations from the module
        // Strip the export statements and grab the translations object
        const stripped = script
          .replace(/^export\s+function\s+\w+[^}]*\{[\s\S]*?\n\}/gm, '')
          .replace(/^export\s+\{[^}]*\}/gm, '')
          .replace(/^export\s+/gm, '');

        // eslint-disable-next-line no-new-func
        const fn = new Function(`
          ${stripped}
          return translations;
        `);
        const translations = fn();

        for (const lang of langs) {
          const obj = translations[lang];
          if (!obj) {
            missing.push({ lang, key: '__LANGUAGE_MISSING__' });
            continue;
          }
          for (const key of keys) {
            const val = obj[key];
            if (val === undefined || val === null || String(val).trim() === '') {
              missing.push({ lang, key });
            }
          }
        }
      } catch (e) {
        missing.push({ lang: 'ERROR', key: String(e) });
      }
      return missing;
    },
    { script: scriptContent, langs: LANGS, keys: CRITICAL_KEYS }
  );

  if (missing.length > 0) {
    const report = missing
      .map(({ lang, key }) => `  ${lang}: '${key}'`)
      .join('\n');
    throw new Error(`Missing i18n keys detected:\n${report}`);
  }

  expect(missing).toHaveLength(0);
});

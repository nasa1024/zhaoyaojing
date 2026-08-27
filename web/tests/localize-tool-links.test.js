import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { rewriteDist, rewriteLocalizedToolLinks } from '../scripts/localize-tool-links.mjs';

test('rewrites legacy English and root tool links on localized content pages', () => {
  const source = [
    '<a href="/en/tools/">Tools</a>',
    '<a href="/en/tools/png-parameter-extractor/">Open viewer</a>',
    '<a href="/tools/c2pa-validator/">Validate</a>',
    '<script type="application/ld+json">{"url":"https://www.aicheck365.com/en/tools/exif-xmp-reader/"}</script>',
  ].join('');

  const result = rewriteLocalizedToolLinks(source, '/ja/platforms/comfyui/');

  assert.equal(result.replacements, 4);
  assert.match(result.html, /href="\/ja\/tools\/"/);
  assert.match(result.html, /href="\/ja\/tools\/png-parameter-extractor\/"/);
  assert.match(result.html, /href="\/ja\/tools\/c2pa-validator\/"/);
  assert.match(result.html, /https:\/\/www\.aicheck365\.com\/ja\/tools\/exif-xmp-reader\//);
  assert.equal(result.html.includes('href="/en/tools/'), false);
  assert.equal(result.html.includes('href="/tools/'), false);
  assert.equal(result.html.includes('https://www.aicheck365.com/en/tools/'), false);
});

test('does not rewrite tool pages because their hreflang set must keep English alternates', () => {
  const source = '<link rel="alternate" hreflang="en" href="https://www.aicheck365.com/en/tools/c2pa-validator/">';
  const result = rewriteLocalizedToolLinks(source, '/de/tools/c2pa-validator/');

  assert.equal(result.replacements, 0);
  assert.equal(result.html, source);
});

test('does not rewrite locales without localized tool routes', () => {
  const source = '<a href="/en/tools/">Tools</a>';
  const result = rewriteLocalizedToolLinks(source, '/fr/platforms/comfyui/');

  assert.equal(result.replacements, 0);
  assert.equal(result.html, source);
});

test('rewrites generated HTML files while leaving localized tool pages untouched', async () => {
  const distDir = await mkdtemp(path.join(os.tmpdir(), 'aicheck-links-'));
  try {
    const contentDir = path.join(distDir, 'ko', 'platforms', 'comfyui');
    const toolDir = path.join(distDir, 'ko', 'tools', 'c2pa-validator');
    const unsupportedDir = path.join(distDir, 'es', 'platforms', 'comfyui');
    await Promise.all([
      mkdir(contentDir, { recursive: true }),
      mkdir(toolDir, { recursive: true }),
      mkdir(unsupportedDir, { recursive: true }),
    ]);

    await writeFile(path.join(contentDir, 'index.html'), '<a href="/en/tools/">도구</a>', 'utf8');
    await writeFile(
      path.join(toolDir, 'index.html'),
      '<link rel="alternate" hreflang="en" href="https://www.aicheck365.com/en/tools/c2pa-validator/">',
      'utf8',
    );
    await writeFile(path.join(unsupportedDir, 'index.html'), '<a href="/en/tools/">Herramientas</a>', 'utf8');

    const result = await rewriteDist(distDir);

    assert.deepEqual(result, { scannedFiles: 3, changedFiles: 1, replacements: 1 });
    assert.equal(
      await readFile(path.join(contentDir, 'index.html'), 'utf8'),
      '<a href="/ko/tools/">도구</a>',
    );
    assert.match(
      await readFile(path.join(toolDir, 'index.html'), 'utf8'),
      /https:\/\/www\.aicheck365\.com\/en\/tools\/c2pa-validator\//,
    );
    assert.equal(
      await readFile(path.join(unsupportedDir, 'index.html'), 'utf8'),
      '<a href="/en/tools/">Herramientas</a>',
    );
  } finally {
    await rm(distDir, { recursive: true, force: true });
  }
});

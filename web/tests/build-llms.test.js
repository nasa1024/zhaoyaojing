import assert from 'node:assert/strict';
import test from 'node:test';

import { extractPage, renderLlmsFullTxt, renderLlmsTxt, sectionForPath } from '../scripts/build-llms.mjs';

function page({ lang = 'en', path = '/en/blog/what-is-c2pa/', canonical, robots = 'index, follow', jsonLd = [] } = {}) {
  return [
    `<html lang="${lang}"><head>`,
    '<title>What Is C2PA? &amp; Content Credentials | AICheck365</title>',
    '<meta name="description" content="C2PA is the open standard behind Content Credentials.">',
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${canonical ?? `https://www.aicheck365.com${path}`}">`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    '</head><body></body></html>',
  ].join('');
}

const faqLd = [
  { '@type': 'Article', dateModified: '2026-07-23' },
  { '@type': 'TechArticle', dateModified: '2026-09-24T00:00:00Z' },
  {
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Is C2PA a watermark?', acceptedAnswer: { '@type': 'Answer', text: 'No. It is <b>signed</b> metadata.' } },
    ],
  },
];

test('extracts title, description, latest dateModified and FAQ answers', () => {
  const result = extractPage(page({ jsonLd: faqLd }), '/en/blog/what-is-c2pa/');

  assert.equal(result.url, 'https://www.aicheck365.com/en/blog/what-is-c2pa/');
  assert.equal(result.lang, 'en');
  assert.equal(result.section, 'guides');
  assert.equal(result.title, 'What Is C2PA? & Content Credentials | AICheck365');
  assert.equal(result.updatedAt, '2026-09-24');
  assert.deepEqual(result.faq, [{ q: 'Is C2PA a watermark?', a: 'No. It is signed metadata.' }]);
});

test('skips noindex pages and pages canonicalized elsewhere', () => {
  assert.equal(extractPage(page({ robots: 'noindex, follow' }), '/en/blog/what-is-c2pa/'), null);
  assert.equal(
    extractPage(page({ canonical: 'https://www.aicheck365.com/blog/what-is-c2pa/' }), '/en/blog/what-is-c2pa/'),
    null,
  );
});

test('groups localized routes into the same section as the default locale', () => {
  assert.equal(sectionForPath('/'), 'detector');
  assert.equal(sectionForPath('/ja/'), 'detector');
  assert.equal(sectionForPath('/en/ai-video-detector/'), 'tools');
  assert.equal(sectionForPath('/de/tools/c2pa-validator/'), 'tools');
  assert.equal(sectionForPath('/platforms/gemini/'), 'platforms');
  assert.equal(sectionForPath('/research/firefly-jpeg-2026-06/'), 'research');
  assert.equal(sectionForPath('/en/methodology/'), 'site');
});

test('renders llms.txt with primary-language sections and llms-full.txt with FAQ text', () => {
  const pages = [
    extractPage(page({ jsonLd: faqLd }), '/en/blog/what-is-c2pa/'),
    extractPage(page({ lang: 'zh-CN', path: '/blog/what-is-c2pa/' }), '/blog/what-is-c2pa/'),
    extractPage(page({ lang: 'ja', path: '/ja/' }), '/ja/'),
    extractPage(page({ lang: 'ja', path: '/ja/blog/what-is-c2pa/' }), '/ja/blog/what-is-c2pa/'),
  ];

  const index = renderLlmsTxt(pages);
  assert.match(index, /^# AICheck365\n\n> /);
  assert.match(index, /## Guides \(English\)\n\n- \[What Is C2PA\? & Content Credentials \| AICheck365\]\(https:\/\/www\.aicheck365\.com\/en\/blog\/what-is-c2pa\/\): C2PA is the open standard behind Content Credentials\. \(updated 2026-09-24\)/);
  assert.match(index, /## 知识库 \(简体中文\)/);
  assert.match(index, /## Optional\n\n- \[日本語: /);
  assert.equal(index.includes('/ja/blog/what-is-c2pa/'), false);

  const full = renderLlmsFullTxt(pages);
  assert.match(full, /URL: https:\/\/www\.aicheck365\.com\/en\/blog\/what-is-c2pa\/\nLanguage: en\nLast updated: 2026-09-24/);
  assert.match(full, /### Is C2PA a watermark\?\n\nNo\. It is signed metadata\./);
  assert.equal(full.includes('/ja/'), false);
});

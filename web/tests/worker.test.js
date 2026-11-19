import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AFFILIATE_PARTNERS,
  resolveAffiliateDestination,
  sanitizeSubId,
} from '../affiliate-links.js';
import worker, { affiliateRedirect, canonicalRedirect } from '../worker.js';

test('redirects the apex host to HTTPS www while preserving path and query', () => {
  const response = canonicalRedirect(new Request('http://aicheck365.com/en/platforms/gemini/?ref=gsc'));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://www.aicheck365.com/en/platforms/gemini/?ref=gsc');
});

test('redirects HTTP requests on the canonical host to HTTPS', () => {
  const response = canonicalRedirect(new Request('http://www.aicheck365.com/tools/'));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://www.aicheck365.com/tools/');
});

test('serves canonical HTTPS requests from the static asset binding', async () => {
  const request = new Request('https://www.aicheck365.com/blog/');
  let forwardedRequest;
  const env = {
    ASSETS: {
      async fetch(value) {
        forwardedRequest = value;
        return new Response('asset response', { status: 200 });
      },
    },
  };

  const response = await worker.fetch(request, env);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'asset response');
  assert.equal(forwardedRequest, request);
});

test('does not redirect preview or workers.dev hostnames', () => {
  const response = canonicalRedirect(new Request('https://preview.aicheck365.workers.dev/'));

  assert.equal(response, null);
});

test('redirects localized research URLs to the single English research page in one hop', () => {
  const response = canonicalRedirect(new Request('http://aicheck365.com/zh-TW/research/firefly-jpeg-2026-06/'));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://www.aicheck365.com/research/firefly-jpeg-2026-06/');
  assert.equal(
    canonicalRedirect(new Request('https://www.aicheck365.com/ko/research/')).headers.get('location'),
    'https://www.aicheck365.com/research/',
  );
  assert.equal(canonicalRedirect(new Request('https://www.aicheck365.com/research/openai-png-2026-06/')), null);
  assert.equal(canonicalRedirect(new Request('https://www.aicheck365.com/ja/researcher/')), null);
});

test('redirects localized data file URLs to the single root file', () => {
  const response = canonicalRedirect(new Request('https://www.aicheck365.com/pt-BR/data/samples.json/'));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://www.aicheck365.com/data/samples.json');
  assert.equal(canonicalRedirect(new Request('https://www.aicheck365.com/data/samples.json')), null);
  assert.equal(
    canonicalRedirect(new Request('https://www.aicheck365.com/data/samples.json/')).headers.get('location'),
    'https://www.aicheck365.com/data/samples.json',
  );
});

test('sends HSTS on production pages and redirects but not on preview hosts', async () => {
  const env = { ASSETS: { fetch: async () => new Response('ok', { status: 200 }) } };

  const page = await worker.fetch(new Request('https://www.aicheck365.com/blog/'), env);
  const redirect = await worker.fetch(new Request('https://aicheck365.com/blog/'), env);
  const preview = await worker.fetch(new Request('https://preview.aicheck365.workers.dev/'), env);

  assert.equal(page.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.equal(redirect.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.equal(preview.headers.get('strict-transport-security'), null);
});

test('marks raw data files noindex without touching pages', async () => {
  const env = { ASSETS: { fetch: async () => new Response('{}', { status: 200 }) } };

  const data = await worker.fetch(new Request('https://www.aicheck365.com/data/samples.json'), env);
  const page = await worker.fetch(new Request('https://www.aicheck365.com/blog/'), env);

  assert.equal(data.headers.get('x-robots-tag'), 'noindex');
  assert.equal(page.headers.get('x-robots-tag'), null);
});

test('preserves /_astro/ immutable cache headers on production host', async () => {
  const env = { ASSETS: { fetch: async () => new Response('js', { status: 200 }) } };

  const asset = await worker.fetch(new Request('https://www.aicheck365.com/_astro/app.1234.js'), env);

  assert.equal(asset.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal(asset.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.equal(asset.headers.get('x-content-type-options'), 'nosniff');
});

test('ships default affiliate placeholders disabled so no unapproved link redirects', () => {
  for (const [slug, config] of Object.entries(AFFILIATE_PARTNERS)) {
    assert.equal(config.enabled, false, `${slug} must ship disabled`);
    assert.equal(resolveAffiliateDestination(slug, new URLSearchParams('locale=en')), null);
  }
});

test('sanitizeSubId trims safe tokens and rejects CRLF, PII, and oversize inputs', () => {
  assert.equal(sanitizeSubId('  zh-TW_hero-1  '), 'zh-TW_hero-1');
  assert.equal(sanitizeSubId('a'.repeat(64)), 'a'.repeat(64));
  assert.equal(sanitizeSubId('a'.repeat(65)), null);
  assert.equal(sanitizeSubId(''), null);
  assert.equal(sanitizeSubId('   '), null);
  assert.equal(sanitizeSubId(null), null);
  assert.equal(sanitizeSubId(123), null);
  assert.equal(sanitizeSubId('en\r\nX-Injected: evil'), null);
  assert.equal(sanitizeSubId('user@example.com'), null);
  assert.equal(sanitizeSubId('bad value'), null);
  assert.equal(sanitizeSubId('<script>alert(1)</script>'), null);
});

test('resolveAffiliateDestination preserves query params, maps aliases with precedence, and supports custom subIdParams', () => {
  const overrides = JSON.stringify({
    'adobe-firefly': {
      url: 'https://imp.i12345.net/c/123/456/789?u=https%3A%2F%2Fwww.adobe.com%2Ffirefly&campaign=creator',
      enabled: true,
    },
    'custom-partner': {
      url: 'https://partner.example.com/offer?tag=aicheck',
      enabled: true,
      subIdParams: {
        subId1: 'aff_sub1',
        subId2: 'aff_sub2',
        subId3: 'aff_sub3',
      },
    },
  });

  const resolvedAlias = resolveAffiliateDestination(
    'adobe-firefly',
    new URLSearchParams('locale=zh-TW&placement=article-inline&state=C'),
    overrides,
  );
  assert.equal(
    resolvedAlias,
    'https://imp.i12345.net/c/123/456/789?u=https%3A%2F%2Fwww.adobe.com%2Ffirefly&campaign=creator&subId1=zh-TW&subId2=article-inline&subId3=C',
  );

  const resolvedPrecedence = resolveAffiliateDestination(
    'adobe-firefly',
    new URLSearchParams('subId1=custom-loc&locale=zh-TW&subId2=hero&placement=rail&subId3=B&state=C'),
    overrides,
  );
  const parsed = new URL(resolvedPrecedence);
  assert.equal(parsed.searchParams.get('subId1'), 'custom-loc');
  assert.equal(parsed.searchParams.get('subId2'), 'hero');
  assert.equal(parsed.searchParams.get('subId3'), 'B');
  assert.equal(parsed.searchParams.get('campaign'), 'creator');

  const resolvedCustomParams = resolveAffiliateDestination(
    'Custom-Partner',
    { locale: 'ja', placement: 'tool-sidebar', state: 'A' },
    overrides,
  );
  assert.equal(
    resolvedCustomParams,
    'https://partner.example.com/offer?tag=aicheck&aff_sub1=ja&aff_sub2=tool-sidebar&aff_sub3=A',
  );
});

test('resolveAffiliateDestination ignores unsafe subIds, unknown query params, non-https targets, and malformed overrides', () => {
  const overrides = {
    'safe-partner': {
      url: 'https://partner.example.com/go?ref=site',
      enabled: true,
    },
    'http-partner': {
      url: 'http://partner.example.com/go',
      enabled: true,
    },
    'js-partner': {
      url: 'javascript:alert(1)',
      enabled: true,
    },
    'auth-partner': {
      url: 'https://trusted.com@evil.com/phish',
      enabled: true,
    },
    'truthy-disabled': {
      url: 'https://partner.example.com/go',
      enabled: 'true',
    },
  };

  const resolved = resolveAffiliateDestination(
    'safe-partner',
    new URLSearchParams('locale=user@example.com&placement=hero%0d%0ax:1&state=ok_state&url=https://evil.com'),
    overrides,
  );
  assert.equal(resolved, 'https://partner.example.com/go?ref=site&subId3=ok_state');

  assert.equal(resolveAffiliateDestination('http-partner', '', overrides), null);
  assert.equal(resolveAffiliateDestination('js-partner', '', overrides), null);
  assert.equal(resolveAffiliateDestination('auth-partner', '', overrides), null);
  assert.equal(resolveAffiliateDestination('truthy-disabled', '', overrides), null);
  assert.equal(resolveAffiliateDestination('constructor', '', overrides), null);
  assert.equal(resolveAffiliateDestination('toString', '', overrides), null);
  assert.equal(resolveAffiliateDestination('safe-partner', '', '{malformed-json'), null);
});

test('worker redirects enabled /go/<slug> with 302 and strict security/SEO headers on production and preview hosts', async () => {
  let assetsCalled = false;
  const env = {
    AFFILIATE_LINKS_JSON: JSON.stringify({
      'adobe-firefly': {
        url: 'https://imp.i12345.net/c/123/456/789?u=https%3A%2F%2Fwww.adobe.com%2Ffirefly',
        enabled: true,
      },
    }),
    ASSETS: {
      async fetch() {
        assetsCalled = true;
        return new Response('should not reach assets', { status: 200 });
      },
    },
  };

  const prodResponse = await worker.fetch(
    new Request('https://www.aicheck365.com/go/adobe-firefly?locale=zh-TW&placement=result-state-c&state=C'),
    env,
  );
  assert.equal(assetsCalled, false);
  assert.equal(prodResponse.status, 302);
  assert.equal(
    prodResponse.headers.get('location'),
    'https://imp.i12345.net/c/123/456/789?u=https%3A%2F%2Fwww.adobe.com%2Ffirefly&subId1=zh-TW&subId2=result-state-c&subId3=C',
  );
  assert.equal(prodResponse.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(prodResponse.headers.get('cache-control'), 'no-store, private');
  assert.equal(prodResponse.headers.get('referrer-policy'), 'no-referrer-when-downgrade');
  assert.equal(prodResponse.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(prodResponse.headers.get('strict-transport-security'), 'max-age=31536000');

  const previewResponse = await worker.fetch(
    new Request('https://preview.aicheck365.workers.dev/go/adobe-firefly/?subId1=en'),
    env,
  );
  assert.equal(previewResponse.status, 302);
  assert.equal(
    previewResponse.headers.get('location'),
    'https://imp.i12345.net/c/123/456/789?u=https%3A%2F%2Fwww.adobe.com%2Ffirefly&subId1=en',
  );
  assert.equal(previewResponse.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(previewResponse.headers.get('cache-control'), 'no-store, private');
  assert.equal(previewResponse.headers.get('referrer-policy'), 'no-referrer-when-downgrade');
  assert.equal(previewResponse.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(previewResponse.headers.get('strict-transport-security'), null);

  const headResponse = await affiliateRedirect(
    new Request('https://www.aicheck365.com/go/adobe-firefly?locale=ko', { method: 'HEAD' }),
    env,
  );
  assert.equal(headResponse.status, 302);
  assert.equal(await headResponse.text(), '');
});

test('worker returns 404 noindex for unknown, disabled, or malformed /go/ paths without calling ASSETS', async () => {
  let assetsCalls = 0;
  const env = {
    AFFILIATE_LINKS_JSON: JSON.stringify({
      canva: {
        url: 'https://partner.example.com/canva',
        enabled: false,
      },
    }),
    ASSETS: {
      async fetch() {
        assetsCalls += 1;
        return new Response('asset', { status: 200 });
      },
    },
  };

  for (const url of [
    'https://www.aicheck365.com/go/unknown-partner',
    'https://www.aicheck365.com/go/canva',
    'https://www.aicheck365.com/go/adobe-firefly',
    'https://www.aicheck365.com/go/',
    'https://www.aicheck365.com/go/canva/extra',
  ]) {
    const response = await worker.fetch(new Request(url), env);
    assert.equal(response.status, 404, url);
    assert.equal(await response.text(), 'Not Found');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(response.headers.get('cache-control'), 'no-store, private');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
  }

  const previewNotFound = await worker.fetch(
    new Request('https://preview.aicheck365.workers.dev/go/unknown-partner'),
    env,
  );
  assert.equal(previewNotFound.status, 404);
  assert.equal(previewNotFound.headers.get('strict-transport-security'), null);

  const headNotFound = await worker.fetch(
    new Request('https://www.aicheck365.com/go/unknown-partner', { method: 'HEAD' }),
    env,
  );
  assert.equal(headNotFound.status, 404);
  assert.equal(await headNotFound.text(), '');
  assert.equal(headNotFound.headers.get('x-robots-tag'), 'noindex, nofollow');

  const postResponse = await worker.fetch(
    new Request('https://www.aicheck365.com/go/canva', { method: 'POST' }),
    env,
  );
  assert.equal(postResponse.status, 405);
  assert.equal(postResponse.headers.get('allow'), 'GET, HEAD');
  assert.equal(postResponse.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(assetsCalls, 0);

  // Non-/go/ paths such as /google/ pass through to ASSETS normally.
  const passthrough = await worker.fetch(new Request('https://www.aicheck365.com/google/'), env);
  assert.equal(passthrough.status, 200);
  assert.equal(assetsCalls, 1);
});

test('canonicalRedirect runs before affiliateRedirect on apex and HTTP /go/ requests', async () => {
  const env = {
    AFFILIATE_LINKS_JSON: JSON.stringify({
      'adobe-firefly': {
        url: 'https://partner.example.com/firefly',
        enabled: true,
      },
    }),
    ASSETS: { fetch: async () => new Response('unused', { status: 200 }) },
  };

  const response = await worker.fetch(
    new Request('http://aicheck365.com/go/adobe-firefly?locale=de'),
    env,
  );
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://www.aicheck365.com/go/adobe-firefly?locale=de');
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
});

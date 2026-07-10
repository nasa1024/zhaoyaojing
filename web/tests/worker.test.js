import assert from 'node:assert/strict';
import test from 'node:test';

import worker, { canonicalRedirect } from '../worker.js';

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

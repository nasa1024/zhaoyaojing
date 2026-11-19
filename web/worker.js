import { resolveAffiliateDestination } from './affiliate-links.js';

const CANONICAL_HOST = 'www.aicheck365.com';
const APEX_HOST = 'aicheck365.com';

// Research pages exist only once, in English at /research/. Older client-side
// link localization produced /<lang>/research/... URLs that Google still
// crawls as 404s, so send them to the real page.
const LOCALIZED_RESEARCH_PATH = /^\/(?:zh-CN|zh-TW|en|ja|ko|de|fr|es|pt-BR)(\/research(?:\/.*)?)$/;
// The same localization turned /data/samples.json into /<lang>/data/samples.json/.
const LOCALIZED_DATA_PATH = /^\/(?:zh-CN|zh-TW|en|ja|ko|de|fr|es|pt-BR)(\/data\/[^/]+\.json)\/?$/;
// A data file requested with a trailing slash is a 404 in the asset binding.
const SLASHED_DATA_PATH = /^(\/data\/[^/]+\.json)\/$/;
const AFFILIATE_ROUTE_PREFIX = /^\/go(?:\/|$)/i;
const AFFILIATE_GO_PATH = /^\/go\/([a-z0-9-]+)\/?$/i;
// Browsers and crawlers should never retry this site over plain HTTP. Scoped
// to the host that sends it (no includeSubDomains) so other subdomains are
// unaffected.
const HSTS = 'max-age=31536000';
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
const NOINDEX_NOFOLLOW = 'noindex, nofollow';
const NO_STORE_PRIVATE = 'no-store, private';

function applyAffiliateSecurityHeaders(headers, isProductionHost) {
  headers.set('X-Robots-Tag', NOINDEX_NOFOLLOW);
  headers.set('Cache-Control', NO_STORE_PRIVATE);
  headers.set('X-Content-Type-Options', 'nosniff');
  if (isProductionHost) {
    headers.set('Strict-Transport-Security', HSTS);
  }
}

export function canonicalRedirect(request) {
  const url = new URL(request.url);
  const isProductionHost = url.hostname === APEX_HOST || url.hostname === CANONICAL_HOST;
  const needsCanonicalHost = url.hostname === APEX_HOST;
  const needsHttps = isProductionHost && url.protocol !== 'https:';
  const movedPath = isProductionHost
    ? (url.pathname.match(LOCALIZED_RESEARCH_PATH)
      ?? url.pathname.match(LOCALIZED_DATA_PATH)
      ?? url.pathname.match(SLASHED_DATA_PATH))?.[1]
    : undefined;

  if (!needsCanonicalHost && !needsHttps && !movedPath) return null;

  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.port = '';
  if (movedPath) url.pathname = movedPath;
  return new Response(null, {
    status: 301,
    headers: { Location: url.toString(), 'Strict-Transport-Security': HSTS },
  });
}

export function affiliateRedirect(request, env) {
  const url = new URL(request.url);
  if (!AFFILIATE_ROUTE_PREFIX.test(url.pathname)) return null;

  const isProductionHost = url.hostname === CANONICAL_HOST;
  const method = (request.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    const headers = new Headers({
      Allow: 'GET, HEAD',
      'Content-Type': 'text/plain; charset=utf-8',
    });
    applyAffiliateSecurityHeaders(headers, isProductionHost);
    return new Response('Method Not Allowed', { status: 405, headers });
  }

  const match = url.pathname.match(AFFILIATE_GO_PATH);
  const destination = match
    ? resolveAffiliateDestination(match[1], url.searchParams, env?.AFFILIATE_LINKS_JSON)
    : null;

  if (!destination) {
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
    });
    applyAffiliateSecurityHeaders(headers, isProductionHost);
    return new Response(method === 'HEAD' ? null : 'Not Found', {
      status: 404,
      headers,
    });
  }

  const headers = new Headers({
    Location: destination,
    // Preserve HTTPS->HTTPS referrer for partner attribution while blocking
    // downgrade leaks; destinations are already validated as https:.
    'Referrer-Policy': 'no-referrer-when-downgrade',
  });
  applyAffiliateSecurityHeaders(headers, isProductionHost);
  return new Response(null, { status: 302, headers });
}

export default {
  async fetch(request, env) {
    const redirect = canonicalRedirect(request);
    if (redirect) return redirect;

    const affiliate = affiliateRedirect(request, env);
    if (affiliate) return affiliate;

    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);
    const isProductionHost = url.hostname === CANONICAL_HOST;
    const isDataFile = url.pathname.startsWith('/data/');
    if (!isProductionHost && !isDataFile) return response;

    const tagged = new Response(response.body, response);
    if (isProductionHost) {
      tagged.headers.set('Strict-Transport-Security', HSTS);
      tagged.headers.set('X-Content-Type-Options', 'nosniff');
      // Astro fingerprints everything under /_astro/, so a changed file always
      // gets a new URL and the old one can be cached indefinitely.
      if (response.status === 200 && url.pathname.startsWith('/_astro/')) {
        tagged.headers.set('Cache-Control', IMMUTABLE_CACHE);
      }
    }
    // Raw data files are linked as citations from content pages, so Google
    // crawls them and reports them as "Crawled - currently not indexed".
    // Mark them noindex; crawlers and AI agents can still fetch them.
    if (isDataFile) tagged.headers.set('X-Robots-Tag', 'noindex');
    return tagged;
  },
};

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
// Browsers and crawlers should never retry this site over plain HTTP. Scoped
// to the host that sends it (no includeSubDomains) so other subdomains are
// unaffected.
const HSTS = 'max-age=31536000';

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

export default {
  async fetch(request, env) {
    const redirect = canonicalRedirect(request);
    if (redirect) return redirect;

    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);
    const isProductionHost = url.hostname === CANONICAL_HOST;
    const isDataFile = url.pathname.startsWith('/data/');
    if (!isProductionHost && !isDataFile) return response;

    const tagged = new Response(response.body, response);
    if (isProductionHost) tagged.headers.set('Strict-Transport-Security', HSTS);
    // Raw data files are linked as citations from content pages, so Google
    // crawls them and reports them as "Crawled - currently not indexed".
    // Mark them noindex; crawlers and AI agents can still fetch them.
    if (isDataFile) tagged.headers.set('X-Robots-Tag', 'noindex');
    return tagged;
  },
};

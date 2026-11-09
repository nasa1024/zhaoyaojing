const CANONICAL_HOST = 'www.aicheck365.com';
const APEX_HOST = 'aicheck365.com';

// Research pages exist only once, in English at /research/. Older client-side
// link localization produced /<lang>/research/... URLs that Google still
// crawls as 404s, so send them to the real page.
const LOCALIZED_RESEARCH_PATH = /^\/(?:zh-CN|zh-TW|en|ja|ko|de|fr|es|pt-BR)(\/research(?:\/.*)?)$/;
// The same localization turned /data/samples.json into /<lang>/data/samples.json/.
const LOCALIZED_DATA_PATH = /^\/(?:zh-CN|zh-TW|en|ja|ko|de|fr|es|pt-BR)(\/data\/[^/]+\.json)\/?$/;

export function canonicalRedirect(request) {
  const url = new URL(request.url);
  const isProductionHost = url.hostname === APEX_HOST || url.hostname === CANONICAL_HOST;
  const needsCanonicalHost = url.hostname === APEX_HOST;
  const needsHttps = isProductionHost && url.protocol !== 'https:';
  const movedPath = isProductionHost
    ? (url.pathname.match(LOCALIZED_RESEARCH_PATH) ?? url.pathname.match(LOCALIZED_DATA_PATH))?.[1]
    : undefined;

  if (!needsCanonicalHost && !needsHttps && !movedPath) return null;

  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.port = '';
  if (movedPath) url.pathname = movedPath;
  return Response.redirect(url.toString(), 301);
}

export default {
  async fetch(request, env) {
    const redirect = canonicalRedirect(request);
    if (redirect) return redirect;

    const response = await env.ASSETS.fetch(request);
    // Raw data files are linked as citations from content pages, so Google
    // crawls them and reports them as "Crawled - currently not indexed".
    // Mark them noindex; crawlers and AI agents can still fetch them.
    if (!new URL(request.url).pathname.startsWith('/data/')) return response;
    const tagged = new Response(response.body, response);
    tagged.headers.set('X-Robots-Tag', 'noindex');
    return tagged;
  },
};

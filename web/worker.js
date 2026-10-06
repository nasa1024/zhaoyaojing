const CANONICAL_HOST = 'www.aicheck365.com';
const APEX_HOST = 'aicheck365.com';

// Research pages exist only once, in English at /research/. Older client-side
// link localization produced /<lang>/research/... URLs that Google still
// crawls as 404s, so send them to the real page.
const LOCALIZED_RESEARCH_PATH = /^\/(?:zh-CN|zh-TW|en|ja|ko|de|fr|es|pt-BR)(\/research(?:\/.*)?)$/;

export function canonicalRedirect(request) {
  const url = new URL(request.url);
  const isProductionHost = url.hostname === APEX_HOST || url.hostname === CANONICAL_HOST;
  const needsCanonicalHost = url.hostname === APEX_HOST;
  const needsHttps = isProductionHost && url.protocol !== 'https:';
  const researchPath = isProductionHost ? url.pathname.match(LOCALIZED_RESEARCH_PATH)?.[1] : undefined;

  if (!needsCanonicalHost && !needsHttps && !researchPath) return null;

  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.port = '';
  if (researchPath) url.pathname = researchPath;
  return Response.redirect(url.toString(), 301);
}

export default {
  async fetch(request, env) {
    return canonicalRedirect(request) ?? env.ASSETS.fetch(request);
  },
};

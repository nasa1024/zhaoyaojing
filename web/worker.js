const CANONICAL_HOST = 'www.aicheck365.com';
const APEX_HOST = 'aicheck365.com';

export function canonicalRedirect(request) {
  const url = new URL(request.url);
  const isProductionHost = url.hostname === APEX_HOST || url.hostname === CANONICAL_HOST;
  const needsCanonicalHost = url.hostname === APEX_HOST;
  const needsHttps = isProductionHost && url.protocol !== 'https:';

  if (!needsCanonicalHost && !needsHttps) return null;

  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.port = '';
  return Response.redirect(url.toString(), 301);
}

export default {
  async fetch(request, env) {
    return canonicalRedirect(request) ?? env.ASSETS.fetch(request);
  },
};

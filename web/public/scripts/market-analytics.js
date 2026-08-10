// Adds privacy-safe page context to GA4 events so country-level revenue and
// detector completion can be segmented by locale, page type, and tool type.
// Country itself is supplied by GA4/AdSense; no geolocation is collected here.
(function initMarketAnalytics() {
  if (window.__AICHECK_MARKET_ANALYTICS__) return;
  window.__AICHECK_MARKET_ANALYTICS__ = true;

  const body = document.body;
  const path = window.location.pathname;
  const locale = document.documentElement.lang || 'unknown';
  const inferPageType = () => {
    if (/\/tools\/?$/.test(path)) return 'tool_hub';
    if (path.includes('/tools/')) return 'tool';
    if (path.includes('/platforms/')) return 'platform';
    if (path.includes('/blog/')) return 'article';
    if (path.includes('/research/')) return 'research';
    if (/^\/(?:[a-z]{2}(?:-[A-Z]{2})?)?\/?$/.test(path)) return 'home';
    return 'content';
  };
  const inferToolType = () => {
    const match = path.match(/\/tools\/([^/]+)\/?$/);
    return match?.[1] || (body?.dataset.toolType ?? 'site');
  };
  let landingPath = path;
  try {
    const key = 'aicheck_landing_path_v1';
    landingPath = sessionStorage.getItem(key) || path;
    if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, path);
  } catch {}

  const context = Object.freeze({
    page_locale: body?.dataset.pageLocale || locale,
    page_type: body?.dataset.pageType || inferPageType(),
    tool_type: body?.dataset.toolType || inferToolType(),
    page_path: path,
    landing_path: landingPath,
  });
  window.__AICHECK_MARKET_CONTEXT__ = context;

  // Existing Playwright tests intentionally install a recording stub and
  // assert the historical event allowlist. Do not mutate that test harness.
  if (Array.isArray(window.__ga_calls__)) return;

  const original = window.gtag;
  if (typeof original !== 'function' || original.__aicheckMarketWrapped) return;

  function contextualGtag(...args) {
    if (args[0] === 'event') {
      args[2] = { ...context, ...(args[2] || {}) };
    }
    return original.apply(window, args);
  }
  contextualGtag.__aicheckMarketWrapped = true;
  window.gtag = contextualGtag;
})();

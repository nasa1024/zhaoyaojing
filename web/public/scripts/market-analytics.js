// Adds privacy-safe page context to GA4 events so country-level revenue and
// detector completion can be segmented by locale, page type, tool type, and
// AI answer-engine (GEO) referrer.
// Country itself is supplied by GA4/AdSense; no geolocation is collected here.
(function initMarketAnalytics() {
  if (window.__AICHECK_MARKET_ANALYTICS__) return;
  window.__AICHECK_MARKET_ANALYTICS__ = true;

  const AI_REFERRERS = [
    ['chatgpt', /(?:^|\.)(?:chatgpt\.com|chat\.openai\.com)$/i],
    ['claude', /(?:^|\.)claude\.ai$/i],
    ['perplexity', /(?:^|\.)perplexity\.ai$/i],
    ['gemini', /(?:^|\.)gemini\.google\.com$/i],
    ['copilot', /(?:^|\.)copilot\.microsoft\.com$/i],
    ['grok', /(?:^|\.)grok\.com$/i],
    ['deepseek', /(?:^|\.)deepseek\.com$/i],
    ['kimi', /(?:^|\.)(?:kimi\.moonshot\.cn|kimi\.ai)$/i],
    ['doubao', /(?:^|\.)doubao\.com$/i],
    ['you', /(?:^|\.)you\.com$/i],
    ['phind', /(?:^|\.)phind\.com$/i],
  ];

  const detectAiReferrer = () => {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const utmSource = (params.get('utm_source') || '').trim().toLowerCase();
      for (const [label, pattern] of AI_REFERRERS) {
        if (utmSource === label || pattern.test(utmSource)) return label;
      }
      if (document.referrer) {
        const refHost = new URL(document.referrer).hostname.toLowerCase();
        for (const [label, pattern] of AI_REFERRERS) {
          if (pattern.test(refHost)) return label;
        }
      }
    } catch {}
    return null;
  };

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
  let aiReferrer = detectAiReferrer();
  let isNewGeoSession = Boolean(aiReferrer);
  try {
    const key = 'aicheck_landing_path_v1';
    landingPath = sessionStorage.getItem(key) || path;
    if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, path);

    const refKey = 'aicheck_ai_referrer_v1';
    const storedRef = sessionStorage.getItem(refKey);
    if (storedRef) {
      aiReferrer = storedRef;
      isNewGeoSession = false;
    } else if (aiReferrer) {
      sessionStorage.setItem(refKey, aiReferrer);
    }
  } catch {}

  const baseContext = {
    page_locale: body?.dataset.pageLocale || locale,
    page_type: body?.dataset.pageType || inferPageType(),
    tool_type: body?.dataset.toolType || inferToolType(),
    page_path: path,
    landing_path: landingPath,
  };
  if (aiReferrer) baseContext.ai_referrer = aiReferrer;

  const context = Object.freeze(baseContext);
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

  if (isNewGeoSession && aiReferrer) {
    window.gtag('event', 'geo_referral_landing', {
      ai_referrer: aiReferrer,
    });
  }
})();

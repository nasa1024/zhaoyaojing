const CONSENT_KEY = 'aicheck_consent_v1';
const SUPPORTED_LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR'];
const DEFAULT_IMPACT_STAT_SRC = 'https://utt.impactcdn.com/P-A8151808-6473-4831-b4b6-3341eeb5b97c1.js';

const BANNER_COPY = {
  de: {
    title: 'Datenschutzeinstellungen',
    body: 'AICheck365 analysiert Dateien lokal in Ihrem Browser. Wählen Sie, ob optionale Cookies und Skripte für Analysen, Anzeigen und Affiliate-Partner-Links gespeichert werden dürfen.',
    privacy: 'Datenschutzerklärung',
    essential: 'Nur notwendige',
    accept: 'Alle akzeptieren',
  },
  fr: {
    title: 'Choix de confidentialité',
    body: 'AICheck365 analyse vos fichiers localement dans votre navigateur. Choisissez si des cookies et scripts optionnels peuvent être utilisés pour les statistiques, les annonces et les liens de partenaires affiliés.',
    privacy: 'Politique de confidentialité',
    essential: 'Essentiels uniquement',
    accept: 'Tout accepter',
  },
  es: {
    title: 'Opciones de privacidad',
    body: 'AICheck365 analiza los archivos localmente en tu navegador. Elige si se pueden usar cookies y scripts opcionales para analíticas, anuncios y enlaces de socios afiliados.',
    privacy: 'Política de privacidad',
    essential: 'Solo esenciales',
    accept: 'Aceptar todo',
  },
  en: {
    title: 'Privacy choices',
    body: 'AICheck365 keeps file analysis local in your browser. Choose whether optional cookies and scripts may be used for analytics, ads, and affiliate partner attribution.',
    privacy: 'Privacy policy',
    essential: 'Essential only',
    accept: 'Accept all',
  },
};

function resolvePrivacyHref() {
  const lang = document.documentElement.lang || '';
  if (lang === 'zh-CN') return '/privacy/';
  if (SUPPORTED_LANGS.includes(lang)) return `/${lang}/privacy/`;
  return '/en/privacy/';
}

function ga(name, params = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

function consentPayload(state) {
  const granted = state === 'granted_all';
  return {
    ad_storage: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
  };
}

function saveConsent(state) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ state, updatedAt: new Date().toISOString() }));
  } catch {}
}

function applyConsent(state, mode = 'update') {
  window.__AICHECK_CONSENT_STATE__ = state;
  if (typeof window.gtag === 'function') {
    window.gtag('consent', mode, consentPayload(state));
  }
}

function emitConsentUpdate(state) {
  ga('consent_update', { consent_state_group: state });
}

function dismissBanner() {
  document.getElementById('consent-banner')?.remove();
}

/**
 * Idempotently loads the Impact.com STAT tag once consent is granted.
 */
function loadImpactStat() {
  if (window.__AICHECK_IMPACT_LOADED__) return false;
  if (window.__AICHECK_CONSENT_REQUIRED__ && window.__AICHECK_CONSENT_STATE__ !== 'granted_all') {
    return false;
  }
  if (window.__AICHECK_CONSENT_STATE__ === 'essential_only' || window.__AICHECK_CONSENT_STATE__ === 'unset_required') {
    return false;
  }
  const src = window.__AICHECK_IMPACT_STAT_SRC__ || DEFAULT_IMPACT_STAT_SRC;
  if (!src) return false;

  window.__AICHECK_IMPACT_LOADED__ = true;
  (function (i, m, p, a, c, t) {
    c.ire_o = p;
    c[p] = c[p] || function () { (c[p].a = c[p].a || []).push(arguments); };
    t = a.createElement(m);
    const z = a.getElementsByTagName(m)[0];
    t.async = 1;
    t.src = i;
    if (z && z.parentNode) {
      z.parentNode.insertBefore(t, z);
    } else {
      (a.head || a.documentElement).appendChild(t);
    }
  })(src, 'script', 'impactStat', document, window);
  window.impactStat('transformLinks');
  window.impactStat('trackImpression');
  return true;
}

function scheduleImpactStat() {
  const runWhenIdle = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => loadImpactStat(), { timeout: 1200 });
    } else {
      window.setTimeout(loadImpactStat, 1200);
    }
  };
  if (document.readyState === 'complete') {
    runWhenIdle();
  } else {
    window.addEventListener('load', runWhenIdle, { once: true });
  }
}

function initImpactStat() {
  if (window.__AICHECK_CONSENT_STATE__ === 'granted_all') {
    scheduleImpactStat();
  }
}

function chooseConsent(state) {
  saveConsent(state);
  applyConsent(state, 'update');
  emitConsentUpdate(state);
  if (state === 'granted_all') {
    loadImpactStat();
  }
  dismissBanner();
}

function hasStoredConsent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    return Boolean(parsed?.state);
  } catch {
    return false;
  }
}

function renderBanner() {
  if (!window.__AICHECK_CONSENT_REQUIRED__ || hasStoredConsent()) return;
  if (document.getElementById('consent-banner')) return;

  const lang = document.documentElement.lang || '';
  const copy = BANNER_COPY[lang] || BANNER_COPY.en;
  const privacyHref = resolvePrivacyHref();

  const banner = document.createElement('aside');
  banner.id = 'consent-banner';
  banner.className = 'consent-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', copy.title);
  banner.innerHTML = `
    <div class="consent-copy">
      <strong></strong>
      <p></p>
      <a></a>
    </div>
    <div class="consent-actions">
      <button type="button" class="ghost" data-consent-choice="essential_only"></button>
      <button type="button" data-consent-choice="granted_all"></button>
    </div>
  `;
  banner.querySelector('strong').textContent = copy.title;
  banner.querySelector('p').textContent = copy.body;
  const privacyLink = banner.querySelector('a');
  privacyLink.href = privacyHref;
  privacyLink.textContent = copy.privacy;
  banner.querySelector('[data-consent-choice="essential_only"]').textContent = copy.essential;
  banner.querySelector('[data-consent-choice="granted_all"]').textContent = copy.accept;

  banner.addEventListener('click', (event) => {
    const button = event.target.closest('[data-consent-choice]');
    if (!button) return;
    chooseConsent(button.dataset.consentChoice);
  });
  document.body.appendChild(banner);
}

window.__AICHECK_SET_CONSENT__ = chooseConsent;
window.__AICHECK_LOAD_IMPACT__ = loadImpactStat;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderBanner, { once: true });
} else {
  renderBanner();
}

initImpactStat();

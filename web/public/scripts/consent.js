const CONSENT_KEY = 'aicheck_consent_v1';

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

function chooseConsent(state) {
  saveConsent(state);
  applyConsent(state, 'update');
  emitConsentUpdate(state);
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

  const banner = document.createElement('aside');
  banner.id = 'consent-banner';
  banner.className = 'consent-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Privacy choices');
  banner.innerHTML = `
    <div class="consent-copy">
      <strong>Privacy choices</strong>
      <p>AICheck365 keeps file analysis local. For analytics and ads storage, choose whether Google tags may store cookies on this browser.</p>
      <a href="/privacy/">Privacy policy</a>
    </div>
    <div class="consent-actions">
      <button type="button" class="ghost" data-consent-choice="essential_only">Essential only</button>
      <button type="button" data-consent-choice="granted_all">Accept analytics and ads</button>
    </div>
  `;
  banner.addEventListener('click', (event) => {
    const button = event.target.closest('[data-consent-choice]');
    if (!button) return;
    chooseConsent(button.dataset.consentChoice);
  });
  document.body.appendChild(banner);
}

window.__AICHECK_SET_CONSENT__ = chooseConsent;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderBanner, { once: true });
} else {
  renderBanner();
}

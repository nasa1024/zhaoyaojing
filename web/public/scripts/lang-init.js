import { applyI18n, setLang } from '/scripts/i18n.js';

applyI18n();

document.getElementById('lang-switch')?.addEventListener('change', (e) => {
  const lang = e.target.value;
  // Single-language pages (e.g. /tools/*) have no localized variant of THIS
  // path, so navigating to it would 404. Switch the stored language and send
  // the user to that language's homepage instead.
  if (document.body?.dataset.singleLang === 'true') {
    setLang(lang, { navigate: false });
    window.location.assign(lang === 'zh-CN' ? '/' : `/${lang}/`);
    return;
  }
  setLang(lang);
});

// ─── Hamburger menu ───────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger?.addEventListener('click', () => {
  const expanded = hamburger.getAttribute('aria-expanded') === 'true';
  hamburger.setAttribute('aria-expanded', String(!expanded));
  mobileMenu?.classList.toggle('open', !expanded);
  mobileMenu?.setAttribute('aria-hidden', String(expanded));
});

// Close menu on outside click
document.addEventListener('click', (e) => {
  if (hamburger && mobileMenu && !hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }
});

// ─── Light / Dark theme toggle ────────────────────────────────────
const themeBtn = document.getElementById('theme-toggle');

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  if (themeBtn) themeBtn.textContent = theme === 'light' ? '☽' : '☀';
  localStorage.setItem('theme', theme);
}

const savedTheme = localStorage.getItem('theme')
  ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
applyTheme(savedTheme);

themeBtn?.addEventListener('click', () => {
  applyTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light');
});

// ─── ad_viewable: fire once when a reserved ad slot scrolls into view ─────
// Measures ad-slot viewability (spec §18). Works on the reserved containers
// today; stays correct once live AdSense markup is uncommented. Sends only a
// slot identifier — never file or result data.
(function trackAdViewable() {
  const slots = document.querySelectorAll('.ad-slot');
  if (!slots.length || typeof IntersectionObserver !== 'function') return;
  const ga = (name, params) => { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); };
  const slotName = (el) =>
    (Array.from(el.classList).find((c) => c.startsWith('ad-slot--')) || 'ad-slot').replace('ad-slot--', '') || 'ad';
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        ga('ad_viewable', { slot: slotName(entry.target) });
        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0.5 });
  slots.forEach((s) => io.observe(s));
})();

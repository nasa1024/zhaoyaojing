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

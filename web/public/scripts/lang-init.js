// Minimal i18n init for pages that don't load main.js
import { applyI18n, setLang } from '/scripts/i18n.js';

applyI18n();

document.getElementById('lang-switch')?.addEventListener('change', (e) => {
  setLang(e.target.value);
});

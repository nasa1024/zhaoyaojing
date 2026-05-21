// Minimal i18n init for pages that don't load main.js
import { applyI18n, getCurrentLang, setLang } from '/scripts/i18n.js';

applyI18n();

document.getElementById('lang-switch')?.addEventListener('click', () => {
  setLang(getCurrentLang() === 'zh-CN' ? 'en' : 'zh-CN');
});

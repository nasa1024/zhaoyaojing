import { test, expect } from '@playwright/test';
import { HOME_I18N } from '../src/i18n/home.js';

const LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR'];

test('home dictionary: all 9 languages present with complete structure', async () => {
  for (const lang of LANGS) {
    const h = HOME_I18N[lang];
    expect(h, `language ${lang} missing`).toBeTruthy();
    expect(h.vanish.steps, `${lang} vanish.steps`).toHaveLength(5);
    expect(h.fiveLayer.layerTitles, `${lang} layerTitles`).toHaveLength(5);
    expect(h.methodology.canList, `${lang} canList`).toHaveLength(8);
    expect(h.methodology.cannotList, `${lang} cannotList`).toHaveLength(5);
    const leaves = [
      h.anatomy.caption, h.platforms.title, h.platforms.subtitle,
      h.vanish.title, h.vanish.emphasis, h.vanish.badgeIntact, h.vanish.badgeLost,
      h.fiveLayer.title, h.methodology.section, h.methodology.slogan, h.methodology.link,
      h.sample.title, h.sample.source, h.sample.limits, h.experiments.title, h.experiments.parser,
      ...h.vanish.steps.flatMap((s) => [s.title, s.detail]),
      ...h.fiveLayer.layerTitles, ...h.methodology.canList, ...h.methodology.cannotList,
    ];
    for (const v of leaves) {
      expect(String(v ?? '').trim().length, `${lang} has an empty leaf string`).toBeGreaterThan(0);
    }
  }
});

test('home dictionary: the 8 non-English locales are genuinely translated (not EN fallbacks)', async () => {
  const en = HOME_I18N.en;
  for (const lang of ['zh-CN', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR']) {
    expect(HOME_I18N[lang].vanish.title, `${lang} vanish.title equals EN`).not.toBe(en.vanish.title);
    expect(HOME_I18N[lang].methodology.section, `${lang} methodology.section equals EN`).not.toBe(en.methodology.section);
  }
});

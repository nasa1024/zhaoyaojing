import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const contentDir = path.join(rootDir, 'src/data/content');
const SITE_URL = 'https://www.aicheck365.com';
const SUPPORTED_LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR'];
const META_DESCRIPTION_MIN_LENGTH = 50;
const COMPACT_DESCRIPTION_MIN_LENGTH = 35;
const META_DESCRIPTION_MAX_LENGTH = 170;
const META_DESCRIPTION_MIN_BOUNDARY = 50;
const COMPACT_DESCRIPTION_LANGS = new Set(['zh-cn', 'zh-tw', 'ja', 'ko']);
const registryFiles = fs.readdirSync(contentDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  .map((entry) => `src/data/content/${entry.name}`)
  .sort();

const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(relPath) {
  const parsed = JSON.parse(fs.readFileSync(path.join(rootDir, relPath), 'utf8'));
  if (!Array.isArray(parsed)) {
    fail(`${relPath}: content registry must be a JSON array`);
    return [];
  }
  return parsed;
}

function decodeHtml(value = '') {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseAttributes(tag) {
  const attrs = {};
  const source = tag
    .replace(/^<\s*\/?\s*[^\s>]+/i, '')
    .replace(/\/?>\s*$/i, '');
  const pattern = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

function openingTags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function elementContents(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi'))]
    .map((match) => decodeHtml(match[1].trim()));
}

function markupOnly(html) {
  return html
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');
}

function stripHtml(html) {
  return markupOnly(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cjkCount(text) {
  return (text.match(/[\u3400-\u9fff]/g) || []).length;
}

function builtFileForRoute(route) {
  const url = new URL(route, SITE_URL);
  if (url.origin !== SITE_URL) return null;
  if (url.pathname === '/') return path.join(distDir, 'index.html');

  const trimmed = decodeURIComponent(url.pathname).replace(/^\/|\/$/g, '');
  const candidates = [
    path.join(distDir, trimmed, 'index.html'),
    path.join(distDir, `${trimmed}.html`),
    path.join(distDir, trimmed),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

function routeExists(route) {
  const url = new URL(route, SITE_URL);
  if (url.origin !== SITE_URL) return true;
  const filePath = builtFileForRoute(url.href);
  return Boolean(filePath && fs.existsSync(filePath));
}

function routeForHtmlFile(filePath) {
  const relative = path.relative(distDir, filePath).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'/index.html'.length)}/`;
  return `/${relative.replace(/\.html$/i, '')}/`;
}

function walkFiles(dir, predicate) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(fullPath, predicate));
    else if (predicate(fullPath)) files.push(fullPath);
  }
  return files;
}

const BRAND_DESCRIPTOR = {
  'zh-CN': 'AI 图片视频检测',
  'zh-TW': 'AI 圖片影片檢測',
  en: 'AI Media Detector',
  ja: 'AI画像・動画検出',
  ko: 'AI 이미지·영상 검출',
  de: 'KI-Medienerkennung',
  fr: 'Détecteur de médias IA',
  es: 'Detector de medios IA',
  'pt-BR': 'Detector de mídia de IA',
};

function normalizeMetaTitle(value, lang) {
  let normalized = value;
  if (value.length > 70) {
    normalized = value
      .replace('How to Detect AI-Generated Videos: MP4 Metadata, C2PA, and Frame Watermarks', 'AI Video Detection: MP4 Metadata and C2PA')
      .replace('What Is C2PA and What Does It Record in AI Images and Videos?', 'What C2PA Records in AI Media')
      .replace('AI Media Metadata Guide: EXIF, XMP, C2PA, PNG tEXt, and MP4', 'AI Media Metadata: EXIF, XMP, C2PA and MP4')
      .replace('AI-generierte Videos erkennen: MP4-Metadaten, C2PA und Frame-Wasserzeichen', 'AI-Videos erkennen: MP4, C2PA und Frame-Wasserzeichen')
      .replace('Was ist C2PA und was speichert es in AI-Bildern und -Videos?', 'C2PA in AI-Bildern und -Videos')
      .replace('Cómo detectar videos generados por IA: metadatos MP4, C2PA y marcas de agua', 'Detectar videos IA: MP4, C2PA y marcas de agua')
      .replace('Détecter les vidéos générées par IA : métadonnées MP4, C2PA et filigranes', 'Détecter les vidéos IA : MP4, C2PA et filigranes')
      .replace('Détecter les images et vidéos Gemini avec les métadonnées C2PA', 'Détecter les images Gemini avec C2PA')
      .replace('Guide des métadonnées média IA : EXIF, XMP, C2PA, PNG tEXt et MP4', 'Métadonnées IA : EXIF, XMP, C2PA et MP4')
      .replace('Qu’est-ce que C2PA et que contient-il dans les images et vidéos IA ?', 'C2PA dans les images et vidéos IA')
      .replace('Guía de metadatos de medios IA: EXIF, XMP, C2PA, PNG tEXt y MP4', 'Metadatos IA: EXIF, XMP, C2PA y MP4')
      .replace('Como detectar vídeos gerados por IA: metadados MP4, C2PA e marcas d’água', 'Detectar vídeos IA: MP4, C2PA e marcas d agua')
      .replace('Guia de metadados de mídia de IA: EXIF, XMP, C2PA, PNG tEXt e MP4', 'Metadados de IA: EXIF, XMP, C2PA e MP4')
      .replace('O que é C2PA e o que ele registra em imagens e vídeos de IA?', 'C2PA em imagens e vídeos de IA')
      .replace(' | AICheck365 Blog', ' | AICheck365')
      .replace(' | AICheck365', '')
      .replace('AICheck365 · AI Image/Video Detector | Free AI-Generated Media Detection', 'AICheck365 AI Media Detector | Local AI Image and Video Checks');
  }
  if (normalized.length > 70) {
    normalized = `${normalized.slice(0, 67).replace(/\s+\S*$/, '')}...`;
  }
  // Short titles get the brand descriptor appended so the SERP entry is not a
  // bare label. The descriptor has to be localized: CJK titles are short by
  // character count almost by definition, so a hardcoded English descriptor
  // ended up on Japanese, Korean and Chinese pages.
  const descriptor = BRAND_DESCRIPTOR[lang] ?? BRAND_DESCRIPTOR.en;
  // A title that already names the brand does not need the brand suffix too:
  // "Sobre o AICheck365 | AICheck365" reads as a duplication in the SERP.
  if (normalized.endsWith(' | AICheck365') && normalized.slice(0, -13).includes('AICheck365')) {
    normalized = `${normalized.slice(0, -13)} | ${descriptor}`;
  }
  if (normalized.length < 30 && !normalized.includes(descriptor)) {
    const [head] = normalized.split(' | AICheck365');
    // Titles that already name the brand only need the descriptor, otherwise
    // the SERP entry reads "About AICheck365 | AICheck365 AI Media Detector".
    const suffix = head.includes('AICheck365') ? descriptor : `AICheck365 ${descriptor}`;
    return normalized.includes(' | AICheck365')
      ? normalized.replace(' | AICheck365', ` | ${suffix}`)
      : `${normalized} | ${suffix}`;
  }
  return normalized;
}

function normalizeMetaDescription(value) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length <= META_DESCRIPTION_MAX_LENGTH) return normalized;

  const candidate = normalized.slice(0, META_DESCRIPTION_MAX_LENGTH);
  let sentenceEnd = -1;
  for (const match of candidate.matchAll(/(?:[.!?](?=\s|$)|[。！？])/g)) {
    sentenceEnd = (match.index ?? -1) + 1;
  }
  if (sentenceEnd >= META_DESCRIPTION_MIN_BOUNDARY) {
    return candidate.slice(0, sentenceEnd).trim();
  }

  const wordEnd = candidate.lastIndexOf(' ', META_DESCRIPTION_MAX_LENGTH - 1);
  if (wordEnd >= META_DESCRIPTION_MIN_BOUNDARY) {
    return `${candidate.slice(0, wordEnd).replace(/[,;:，；：-]+$/u, '').trimEnd()}…`;
  }

  let clauseEnd = -1;
  for (const match of candidate.matchAll(/[,;:，、；：]/gu)) {
    clauseEnd = (match.index ?? -1) + 1;
  }
  if (clauseEnd >= META_DESCRIPTION_MIN_BOUNDARY) {
    return `${candidate.slice(0, clauseEnd).replace(/[,;:，、；：]+$/u, '').trimEnd()}…`;
  }

  return normalized;
}

function minimumDescriptionLength(lang) {
  return COMPACT_DESCRIPTION_LANGS.has(lang.toLowerCase())
    ? COMPACT_DESCRIPTION_MIN_LENGTH
    : META_DESCRIPTION_MIN_LENGTH;
}

function parseBuiltPage(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const markup = markupOnly(html);
  const label = path.relative(rootDir, filePath);
  const route = routeForHtmlFile(filePath);

  const htmlTags = openingTags(markup, 'html').map(parseAttributes);
  if (htmlTags.length !== 1) fail(`${label}: expected exactly one html element, found ${htmlTags.length}`);
  const lang = htmlTags[0]?.lang?.trim() ?? '';
  if (!lang) fail(`${label}: html lang must not be empty`);
  else if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(lang)) fail(`${label}: invalid html lang value "${lang}"`);

  const routeLang = route.split('/').filter(Boolean)[0];
  if (SUPPORTED_LANGS.includes(routeLang) && routeLang.toLowerCase() !== lang.toLowerCase()) {
    fail(`${label}: html lang "${lang}" does not match localized route prefix "${routeLang}"`);
  }

  const titles = elementContents(markup, 'title');
  if (titles.length !== 1) fail(`${label}: expected exactly one <title>, found ${titles.length}`);
  if (titles.length === 1 && !titles[0]) fail(`${label}: title must not be empty`);

  const metaTags = openingTags(markup, 'meta').map(parseAttributes);
  const descriptions = metaTags.filter((attrs) => attrs.name?.toLowerCase() === 'description');
  if (descriptions.length !== 1) fail(`${label}: expected exactly one meta description, found ${descriptions.length}`);
  const description = descriptions[0]?.content?.trim() ?? '';
  if (descriptions.length === 1 && !description) fail(`${label}: meta description must not be empty`);
  const descriptionMinLength = minimumDescriptionLength(lang);
  if (description && description.length < descriptionMinLength) {
    fail(`${label}: meta description is too short (${description.length}; minimum ${descriptionMinLength} for ${lang || 'unknown language'})`);
  }
  if (description.length > META_DESCRIPTION_MAX_LENGTH) {
    fail(`${label}: meta description is too long (${description.length}; maximum ${META_DESCRIPTION_MAX_LENGTH})`);
  }

  const linkTags = openingTags(markup, 'link').map(parseAttributes);
  const canonicals = linkTags.filter((attrs) => attrs.rel?.toLowerCase().split(/\s+/).includes('canonical'));
  if (canonicals.length !== 1) fail(`${label}: expected exactly one canonical link, found ${canonicals.length}`);
  const canonical = canonicals[0]?.href?.trim() ?? '';
  if (canonicals.length === 1 && !canonical) fail(`${label}: canonical href must not be empty`);
  if (canonical) {
    try {
      const canonicalUrl = new URL(canonical);
      if (canonicalUrl.origin !== SITE_URL) fail(`${label}: canonical must use ${SITE_URL}, got ${canonical}`);
      if (canonicalUrl.search || canonicalUrl.hash) fail(`${label}: canonical must not contain a query or hash: ${canonical}`);
      if (canonicalUrl.pathname !== route) fail(`${label}: canonical path ${canonicalUrl.pathname} does not match built route ${route}`);
    } catch {
      fail(`${label}: canonical is not a valid absolute URL: ${canonical}`);
    }
  }

  const h1Count = openingTags(markup, 'h1').length;
  if (h1Count !== 1) fail(`${label}: expected exactly one H1, found ${h1Count}`);

  const robotsTags = metaTags.filter((attrs) => attrs.name?.toLowerCase() === 'robots');
  const robots = robotsTags.map((attrs) => attrs.content ?? '').join(',');
  const noindex = /(?:^|[,\s])noindex(?:$|[,\s])/i.test(robots);

  const alternateLinks = linkTags
    .filter((attrs) => attrs.rel?.toLowerCase().split(/\s+/).includes('alternate') && attrs.hreflang !== undefined)
    .map((attrs) => ({ lang: attrs.hreflang.trim(), href: attrs.href?.trim() ?? '' }));
  const alternateByLang = new Map();
  for (const alternate of alternateLinks) {
    const key = alternate.lang.toLowerCase();
    if (!alternate.lang) fail(`${label}: hreflang must not be empty`);
    if (!alternate.href) fail(`${label}: hreflang ${alternate.lang || '(empty)'} is missing href`);
    if (alternateByLang.has(key)) fail(`${label}: duplicate hreflang ${alternate.lang}`);
    alternateByLang.set(key, alternate);
  }

  const jsonLdPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(jsonLdPattern)) {
    const attrs = parseAttributes(`<script${match[1]}>`);
    if (attrs.type?.toLowerCase() !== 'application/ld+json') continue;
    const payload = match[2].trim();
    if (!payload) {
      fail(`${label}: JSON-LD script must not be empty`);
      continue;
    }
    try {
      JSON.parse(payload);
    } catch (error) {
      fail(`${label}: JSON-LD is not valid JSON (${error.message})`);
    }
  }

  return {
    filePath,
    html,
    label,
    route,
    title: titles[0] ?? '',
    description,
    canonical,
    lang,
    noindex,
    alternateLinks,
    alternateByLang,
  };
}

function localToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validLastmod(value) {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return false;
  const datePart = value.slice(0, 10);
  const dateOnly = new Date(`${datePart}T00:00:00Z`);
  if (Number.isNaN(dateOnly.getTime()) || dateOnly.toISOString().slice(0, 10) !== datePart) return false;
  return !Number.isNaN(Date.parse(value));
}

function collectSitemapEntries() {
  const entries = new Map();
  const sitemapFiles = walkFiles(distDir, (filePath) => /^sitemap.*\.xml$/i.test(path.basename(filePath)));
  if (!sitemapFiles.length) fail('dist: no sitemap XML files were generated');
  const today = localToday();

  for (const filePath of sitemapFiles) {
    const xml = fs.readFileSync(filePath, 'utf8');
    for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
      const block = match[1];
      const locs = [...block.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((item) => decodeHtml(item[1].trim()));
      const lastmods = [...block.matchAll(/<lastmod>([\s\S]*?)<\/lastmod>/gi)].map((item) => decodeHtml(item[1].trim()));
      if (locs.length !== 1) {
        fail(`${path.relative(rootDir, filePath)}: sitemap <url> must contain exactly one loc, found ${locs.length}`);
        continue;
      }
      if (lastmods.length !== 1) {
        fail(`${path.relative(rootDir, filePath)}: ${locs[0]} must contain exactly one lastmod, found ${lastmods.length}`);
        continue;
      }

      const value = locs[0];
      const lastmod = lastmods[0];
      try {
        const url = new URL(value);
        if (entries.has(url.href)) fail(`${path.relative(rootDir, filePath)}: duplicate sitemap URL ${url.href}`);
        else entries.set(url.href, lastmod);
      } catch {
        fail(`${path.relative(rootDir, filePath)}: invalid sitemap URL ${value}`);
        continue;
      }

      if (!validLastmod(lastmod)) fail(`${path.relative(rootDir, filePath)}: ${value} has invalid lastmod ${lastmod}`);
      else if (lastmod.slice(0, 10) > today) fail(`${path.relative(rootDir, filePath)}: ${value} has future lastmod ${lastmod} (today is ${today})`);
    }
  }
  return entries;
}

if (!fs.existsSync(distDir)) {
  console.error('SEO QA failed: dist directory does not exist. Run the Astro build first.');
  process.exit(1);
}

const htmlFiles = walkFiles(distDir, (filePath) => filePath.endsWith('.html')).sort();
if (!htmlFiles.length) fail('dist: no HTML pages were generated');
const builtPages = htmlFiles.map(parseBuiltPage);
const pageByFile = new Map(builtPages.map((page) => [path.resolve(page.filePath), page]));
const pageByCanonical = new Map();

for (const page of builtPages) {
  if (!page.canonical) continue;
  const previous = pageByCanonical.get(page.canonical);
  if (previous) fail(`${page.label}: canonical ${page.canonical} is already used by ${previous.label}`);
  else pageByCanonical.set(page.canonical, page);
}

for (const page of builtPages) {
  if (!page.alternateLinks.length) continue;

  const selfAlternate = page.alternateByLang.get(page.lang.toLowerCase());
  if (!selfAlternate) {
    fail(`${page.label}: hreflang set is missing self language ${page.lang}`);
  } else {
    try {
      if (new URL(selfAlternate.href).href !== page.canonical) {
        fail(`${page.label}: self hreflang ${page.lang} must point to canonical ${page.canonical}, got ${selfAlternate.href}`);
      }
    } catch {
      fail(`${page.label}: self hreflang ${page.lang} has invalid URL ${selfAlternate.href}`);
    }
  }

  const xDefault = page.alternateByLang.get('x-default');
  if (!xDefault) fail(`${page.label}: multilingual page is missing x-default hreflang`);

  for (const alternate of page.alternateLinks) {
    let alternateUrl;
    try {
      alternateUrl = new URL(alternate.href);
    } catch {
      fail(`${page.label}: hreflang ${alternate.lang} has invalid URL ${alternate.href}`);
      continue;
    }
    if (alternateUrl.origin !== SITE_URL) {
      fail(`${page.label}: hreflang ${alternate.lang} must point to ${SITE_URL}, got ${alternate.href}`);
      continue;
    }
    if (!routeExists(alternateUrl.href)) {
      fail(`${page.label}: hreflang ${alternate.lang} target does not exist: ${alternateUrl.href}`);
      continue;
    }

    const target = pageByCanonical.get(alternateUrl.href);
    if (!target) {
      fail(`${page.label}: hreflang ${alternate.lang} target is not self-canonical: ${alternateUrl.href}`);
      continue;
    }

    if (alternate.lang.toLowerCase() === 'x-default') {
      if (target.lang.toLowerCase() !== 'en') {
        fail(`${page.label}: x-default must use the English fallback, got ${alternateUrl.href} (${target.lang})`);
      }
      continue;
    }

    const reciprocal = target.alternateByLang.get(page.lang.toLowerCase());
    if (!reciprocal || reciprocal.href !== page.canonical) {
      fail(`${page.label}: hreflang ${alternate.lang} target ${alternateUrl.href} does not reciprocate ${page.lang} -> ${page.canonical}`);
    }
    const targetXDefault = target.alternateByLang.get('x-default');
    if (xDefault && (!targetXDefault || targetXDefault.href !== xDefault.href)) {
      fail(`${page.label}: hreflang target ${alternateUrl.href} does not share x-default ${xDefault.href}`);
    }
  }
}

const notFoundPage = builtPages.find((page) => page.route === '/404/');
if (!notFoundPage) fail('dist: 404 page was not generated');
else if (!notFoundPage.noindex) fail(`${notFoundPage.label}: 404 page must include noindex`);

const sitemapEntries = collectSitemapEntries();
const sitemapUrls = new Set(sitemapEntries.keys());
const indexableCanonicals = new Set(
  builtPages.filter((page) => !page.noindex && page.canonical).map((page) => page.canonical),
);
for (const page of builtPages) {
  if (!page.canonical) continue;
  if (page.noindex) {
    if (sitemapUrls.has(page.canonical)) fail(`${page.label}: noindex canonical must not appear in sitemap: ${page.canonical}`);
  } else if (!sitemapUrls.has(page.canonical)) {
    fail(`${page.label}: indexable canonical is missing from sitemap: ${page.canonical}`);
  }
}
for (const sitemapUrl of sitemapUrls) {
  if (!indexableCanonicals.has(sitemapUrl)) fail(`sitemap: URL is not an indexable built canonical: ${sitemapUrl}`);
}
if (sitemapUrls.size !== indexableCanonicals.size) {
  fail(`sitemap: canonical set size mismatch (sitemap ${sitemapUrls.size}, indexable HTML ${indexableCanonicals.size})`);
}

const pages = registryFiles.flatMap(readJson);
const titleOwners = new Map();

for (const page of pages) {
  if (page.draft) fail(`${page.id}: draft pages must not be registered for production QA`);
  if (!page.title || !page.description || !page.canonical) {
    fail(`${page.id}: missing title, description, or canonical`);
    continue;
  }

  const previous = titleOwners.get(page.title);
  if (previous) fail(`${page.id}: duplicate registered title also used by ${previous}`);
  titleOwners.set(page.title, page.id);

  const htmlPath = builtFileForRoute(page.route);
  if (!htmlPath || !fs.existsSync(htmlPath)) {
    fail(`${page.id}: route ${page.route} did not build to ${htmlPath ? path.relative(rootDir, htmlPath) : '(external route)'}`);
    continue;
  }

  const builtPage = pageByFile.get(path.resolve(htmlPath));
  if (!builtPage) {
    fail(`${page.id}: route ${page.route} did not resolve to a parsed HTML page`);
    continue;
  }

  const expectedTitle = normalizeMetaTitle(page.title, page.locale);
  const expectedDescription = normalizeMetaDescription(page.description);
  if (builtPage.title !== expectedTitle) fail(`${page.id}: title mismatch. expected "${expectedTitle}", got "${builtPage.title}"`);
  if (builtPage.description !== expectedDescription) fail(`${page.id}: description mismatch. expected "${expectedDescription}", got "${builtPage.description}"`);
  if (builtPage.canonical !== page.canonical) fail(`${page.id}: canonical mismatch. expected "${page.canonical}", got "${builtPage.canonical}"`);
  if (page.locale && builtPage.lang !== page.locale) fail(`${page.id}: html lang mismatch. expected "${page.locale}", got "${builtPage.lang}"`);

  for (const href of page.internalLinks || []) {
    if (!routeExists(href)) fail(`${page.id}: internal link does not resolve after build: ${href}`);
  }

  if (page.locale && !page.locale.startsWith('zh') && page.locale !== 'ja') {
    const bodyText = stripHtml(builtPage.html);
    const count = cjkCount(bodyText);
    if (count > 20) fail(`${page.id}: non-Chinese priority page has ${count} CJK characters in rendered body`);
  }
}

if (failures.length) {
  console.error(`SEO QA failed with ${failures.length} issue(s):`);
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`SEO QA passed for ${builtPages.length} built HTML pages and ${pages.length} registered pages from ${registryFiles.length} registries.`);

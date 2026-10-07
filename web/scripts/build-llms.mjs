import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Generative engines (ChatGPT search, Perplexity, Claude, Gemini, Doubao,
// Kimi...) read /llms.txt as a curated map of the site and /llms-full.txt as
// a plain-text corpus they can quote. Both are generated from the built HTML
// so every listed URL, title, description, date and FAQ answer is exactly
// what the indexable page says. A hand-maintained llms.txt drifted: it
// missed the tools, the English pages and the research records.

const SITE_URL = 'https://www.aicheck365.com';
const SUPPORTED_LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR'];
const LANG_NAMES = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
};
// llms-full.txt carries the full corpus only for the two primary languages;
// the other locales are translations of the same facts and would triple the
// file without adding anything quotable.
const FULL_TEXT_LANGS = new Set(['en', 'zh-CN']);
const SECTION_ORDER = ['detector', 'tools', 'platforms', 'guides', 'research', 'site'];
const SECTION_TITLES = {
  en: {
    detector: 'Detector',
    tools: 'Free Tools',
    platforms: 'Platform Guides',
    guides: 'Guides',
    research: 'Research',
    site: 'About, Methodology and Policies',
  },
  'zh-CN': {
    detector: '检测器',
    tools: '免费工具',
    platforms: '平台指南',
    guides: '知识库',
    research: '研究',
    site: '关于、方法论与政策',
  },
};

const INTRO = `# AICheck365

> AICheck365 (https://www.aicheck365.com/) is a free, browser-local AI image and video origin detector. It reads provenance evidence that AI platforms write into files — C2PA Content Credentials, EXIF, XMP, IPTC digital source type, PNG tEXt/iTXt generation parameters, MP4/MOV container metadata, file-name patterns and sampled video-frame watermarks — without uploading the file to a server.

AICheck365（https://www.aicheck365.com/）是免费的浏览器本地 AI 图片/视频来源检测工具：读取文件里的 C2PA、EXIF、XMP、PNG 文本块、MP4/MOV 元数据、文件名和视频帧水印线索，文件不上传服务器。

## Key Facts

- What it does: answers "was this image or video made by an AI tool, and which one?" from evidence stored inside the file, and shows the exact field that produced each signal.
- Privacy: images and videos are analyzed locally in the browser with a WebAssembly parser; file contents and results are not uploaded.
- Cost: free, no account, no API key.
- Signals read: C2PA / Content Credentials (manifest, digitalSourceType, claim_generator, signature validity), EXIF and XMP fields, IPTC DigitalSourceType, PNG text chunks (Stable Diffusion / ComfyUI prompts, seeds, workflows), MP4/MOV metadata and SEI markers, file-name patterns, sampled video-frame watermark checks.
- Platforms covered by guides: Gemini, Google Imagen, DALL-E / GPT Image, Midjourney, Stable Diffusion, ComfyUI, Adobe Firefly, Flux, Leonardo, Ideogram, Sora, Kling and Runway.
- Confidence levels: HIGH (signed or explicit provenance such as C2PA digitalSourceType), MEDIUM (platform-specific metadata fields), LOW (hints such as file names).
- Limitation: a missing signal does not prove a file is human-made. Screenshots, social-media re-encoding, screen recordings, editor exports and metadata stripping remove provenance evidence. The tool reads evidence; it is not a visual "AI-looking" classifier.
- Best input: the original file downloaded directly from the generating platform.
- Languages: ${SUPPORTED_LANGS.map((lang) => `${LANG_NAMES[lang]} (${lang})`).join(', ')}.
- Source code: https://github.com/nasa1024/zhaoyaojing (AGPL-3.0), a fork of https://github.com/MatrixA/aicheck.
- Contact: contact@aicheck365.com
- Full text of the English and Simplified Chinese pages, including FAQ answers: ${SITE_URL}/llms-full.txt
`;

function decodeHtml(value = '') {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match ? decodeHtml(match[1] ?? match[2]) : undefined;
}

function metaContent(html, name) {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (attr(tag, 'name')?.toLowerCase() === name) return attr(tag, 'content') ?? '';
  }
  return undefined;
}

function cleanText(value = '') {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function jsonLdNodes(html) {
  const nodes = [];
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    nodes.push(value);
    if (value['@graph']) visit(value['@graph']);
  };
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      visit(JSON.parse(match[1]));
    } catch {
      // seo-qa reports invalid JSON-LD; a broken block just contributes nothing here.
    }
  }
  return nodes;
}

function hasType(node, type) {
  return [].concat(node['@type'] ?? []).includes(type);
}

export function stripLangPrefix(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && SUPPORTED_LANGS.includes(parts[0])) parts.shift();
  return parts.length ? `/${parts.join('/')}/` : '/';
}

export function sectionForPath(pathname) {
  const base = stripLangPrefix(pathname);
  if (base === '/') return 'detector';
  if (base.startsWith('/tools/') || base === '/ai-video-detector/' || base === '/ai-illust-checker/') return 'tools';
  if (base.startsWith('/platforms/')) return 'platforms';
  if (base.startsWith('/blog/')) return 'guides';
  if (base.startsWith('/research/')) return 'research';
  return 'site';
}

// Returns null for pages generative engines should not be pointed at:
// noindex pages and pages whose canonical points elsewhere.
export function extractPage(html, pathname) {
  const robots = metaContent(html, 'robots') ?? '';
  if (/(?:^|[,\s])noindex(?:$|[,\s])/i.test(robots)) return null;

  const url = `${SITE_URL}${pathname}`;
  const canonicalTag = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => tag)
    .find((tag) => attr(tag, 'rel')?.toLowerCase() === 'canonical');
  const canonical = canonicalTag ? attr(canonicalTag, 'href') : url;
  if (canonical !== url) return null;

  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? '';
  const lang = attr(htmlTag, 'lang') ?? 'zh-CN';
  const title = cleanText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const description = cleanText(metaContent(html, 'description') ?? '');

  const nodes = jsonLdNodes(html);
  const dates = nodes
    .map((node) => node.dateModified)
    .filter((value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))
    .map((value) => value.slice(0, 10))
    .sort();
  const faq = [];
  const seenQuestions = new Set();
  for (const node of nodes.filter((item) => hasType(item, 'FAQPage'))) {
    for (const question of [].concat(node.mainEntity ?? [])) {
      const q = cleanText(question?.name ?? '');
      const a = cleanText(question?.acceptedAnswer?.text ?? '');
      if (!q || !a || seenQuestions.has(q)) continue;
      seenQuestions.add(q);
      faq.push({ q, a });
    }
  }

  return {
    url,
    pathname,
    lang,
    section: sectionForPath(pathname),
    title,
    description,
    updatedAt: dates.at(-1),
    faq,
  };
}

function compareEntries(a, b) {
  // Hubs first within a section, then alphabetical by path.
  const depth = (entry) => stripLangPrefix(entry.pathname).split('/').filter(Boolean).length;
  return depth(a) - depth(b) || a.pathname.localeCompare(b.pathname);
}

function listLine(entry) {
  const updated = entry.updatedAt ? ` (updated ${entry.updatedAt})` : '';
  const description = entry.description ? `: ${entry.description}` : '';
  return `- [${entry.title}](${entry.url})${description}${updated}`;
}

function bySection(entries) {
  const groups = new Map(SECTION_ORDER.map((section) => [section, []]));
  for (const entry of entries) groups.get(entry.section).push(entry);
  for (const group of groups.values()) group.sort(compareEntries);
  return groups;
}

export function renderLlmsTxt(pages) {
  const lines = [INTRO.trimEnd()];
  for (const lang of ['en', 'zh-CN']) {
    const groups = bySection(pages.filter((page) => page.lang === lang));
    for (const section of SECTION_ORDER) {
      const group = groups.get(section);
      if (!group.length) continue;
      lines.push('', `## ${SECTION_TITLES[lang][section]} (${LANG_NAMES[lang]})`, '');
      lines.push(...group.map(listLine));
    }
  }

  const otherLangs = SUPPORTED_LANGS.filter((lang) => !FULL_TEXT_LANGS.has(lang));
  const localizedHomes = otherLangs
    .map((lang) => pages.find((page) => page.lang === lang && page.pathname === `/${lang}/`))
    .filter(Boolean);
  if (localizedHomes.length) {
    lines.push('', '## Optional', '');
    lines.push(...localizedHomes.map((page) => `- [${LANG_NAMES[page.lang]}: ${page.title}](${page.url}): ${page.description}`));
    lines.push(`- [Sitemap](${SITE_URL}/sitemap-index.xml): every indexable URL in all ${SUPPORTED_LANGS.length} languages.`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderLlmsFullTxt(pages) {
  const lines = [INTRO.trimEnd()];
  for (const lang of ['en', 'zh-CN']) {
    const groups = bySection(pages.filter((page) => page.lang === lang));
    for (const section of SECTION_ORDER) {
      for (const page of groups.get(section)) {
        lines.push('', '---', '', `## ${page.title}`, '');
        lines.push(`URL: ${page.url}`);
        lines.push(`Language: ${page.lang}`);
        if (page.updatedAt) lines.push(`Last updated: ${page.updatedAt}`);
        if (page.description) lines.push('', page.description);
        if (page.faq.length) {
          lines.push('');
          for (const { q, a } of page.faq) lines.push(`### ${q}`, '', a, '');
          lines.pop();
        }
      }
    }
  }
  return `${lines.join('\n')}\n`;
}

function routeForHtmlFile(filePath, distDir) {
  const relative = path.relative(distDir, filePath).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return null;
}

function walkHtml(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkHtml(fullPath));
    else if (entry.name === 'index.html') files.push(fullPath);
  }
  return files;
}

export function collectPages(distDir) {
  const pages = [];
  for (const filePath of walkHtml(distDir)) {
    const pathname = routeForHtmlFile(filePath, distDir);
    if (!pathname) continue;
    const page = extractPage(fs.readFileSync(filePath, 'utf8'), pathname);
    if (page) pages.push(page);
  }
  return pages;
}

function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const distDir = path.join(rootDir, 'dist');
  const pages = collectPages(distDir);
  const missingTitle = pages.filter((page) => !page.title);
  if (missingTitle.length) {
    throw new Error(`llms.txt: pages without <title>: ${missingTitle.map((page) => page.pathname).join(', ')}`);
  }
  fs.writeFileSync(path.join(distDir, 'llms.txt'), renderLlmsTxt(pages));
  fs.writeFileSync(path.join(distDir, 'llms-full.txt'), renderLlmsFullTxt(pages));
  const fullCount = pages.filter((page) => FULL_TEXT_LANGS.has(page.lang)).length;
  console.log(`Wrote llms.txt and llms-full.txt from ${pages.length} indexable pages (${fullCount} in full text).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

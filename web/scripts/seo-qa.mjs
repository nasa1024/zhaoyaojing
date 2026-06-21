import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const registryFiles = [
  'src/data/content/tools.json',
  'src/data/content/platforms.json',
  'src/data/content/articles.json',
];
const META_FALLBACKS = {
  'zh-CN': '适合检查原始文件中的 AI 来源信号，覆盖图片、视频、元数据、C2PA、MP4/MOV 字段、文件名线索、平台痕迹和抽样帧水印，所有分析均在浏览器本地完成，不上传文件。',
  'zh-TW': '適合檢查原始檔案中的 AI 來源信號，涵蓋圖片、影片、metadata、C2PA、MP4/MOV 欄位、檔名線索、平台痕跡和抽樣幀浮水印，所有分析都在瀏覽器本機完成，不上傳檔案。',
  en: 'Use it to inspect original AI media files locally for metadata, C2PA, MP4/MOV fields, file-name clues, and frame watermark signals.',
  ja: '原本の AI 画像と動画からメタデータ、C2PA、MP4/MOV 項目、ファイル名、プラットフォーム痕跡、抽出フレーム透かしをブラウザ内でローカル確認できます。ファイルはアップロードされません。',
  ko: '원본 AI 이미지와 비디오 파일의 메타데이터, C2PA, MP4/MOV 필드, 파일명 단서, 프레임 워터마크 신호를 브라우저에서 로컬로 확인합니다.',
  de: 'Prüfe originale AI-Mediendateien lokal auf Metadaten, C2PA, MP4/MOV-Felder, Dateinamen und Frame-Wasserzeichen.',
  fr: 'Inspectez localement les fichiers média IA originaux avec métadonnées, C2PA, champs MP4/MOV, noms de fichier et filigranes.',
  es: 'Analiza archivos multimedia IA originales localmente con metadatos, C2PA, campos MP4/MOV, nombres de archivo y marcas de agua.',
  'pt-BR': 'Verifique arquivos de mídia de IA originais localmente com metadados, C2PA, campos MP4/MOV, nomes de arquivo e marcas d agua.',
};

const failures = [];

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relPath), 'utf8'));
}

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function pathForRoute(route) {
  const url = new URL(route, 'https://www.aicheck365.com');
  const pathname = url.pathname;
  if (pathname === '/') return path.join(distDir, 'index.html');
  const trimmed = pathname.replace(/^\/|\/$/g, '');
  return path.join(distDir, trimmed, 'index.html');
}

function routeExists(route) {
  const url = new URL(route, 'https://www.aicheck365.com');
  if (url.origin !== 'https://www.aicheck365.com') return true;
  const pathname = url.pathname;
  if (pathname === '/') return fs.existsSync(path.join(distDir, 'index.html'));
  const trimmed = pathname.replace(/^\/|\/$/g, '');
  return fs.existsSync(path.join(distDir, trimmed, 'index.html')) ||
    fs.existsSync(path.join(distDir, trimmed));
}

function extractMeta(html) {
  return {
    title: decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || ''),
    description: decodeHtml(html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]?.trim() || ''),
    canonical: decodeHtml(html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i)?.[1]?.trim() || ''),
  };
}

function normalizeMetaTitle(value) {
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
  if (normalized.length < 30 && !normalized.includes('AICheck365 AI')) {
    const expanded = normalized.replace(' | AICheck365', ' | AICheck365 AI Media Detector');
    return expanded.length < 30 ? `${expanded} | AI Media` : expanded;
  }
  return normalized;
}

function normalizeMetaDescription(value, locale) {
  const fallback = META_FALLBACKS[locale] ?? META_FALLBACKS.en;
  if (value.length < 120) {
    return `${value} ${fallback}`.slice(0, 170);
  }
  if (value.length > 170) {
    return `${value.slice(0, 167).replace(/\s+\S*$/, '')}...`;
  }
  return value;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cjkCount(text) {
  return (text.match(/[\u3400-\u9fff]/g) || []).length;
}

function fail(message) {
  failures.push(message);
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

  const htmlPath = pathForRoute(page.route);
  if (!fs.existsSync(htmlPath)) {
    fail(`${page.id}: route ${page.route} did not build to ${path.relative(rootDir, htmlPath)}`);
    continue;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const meta = extractMeta(html);
  const expectedTitle = normalizeMetaTitle(page.title);
  const expectedDescription = normalizeMetaDescription(page.description, page.locale);
  if (meta.title !== expectedTitle) fail(`${page.id}: title mismatch. expected "${expectedTitle}", got "${meta.title}"`);
  if (meta.description !== expectedDescription) fail(`${page.id}: description mismatch. expected "${expectedDescription}", got "${meta.description}"`);
  if (meta.canonical !== page.canonical) fail(`${page.id}: canonical mismatch. expected "${page.canonical}", got "${meta.canonical}"`);

  for (const href of page.internalLinks || []) {
    if (!routeExists(href)) fail(`${page.id}: internal link does not resolve after build: ${href}`);
  }

  if (!page.locale.startsWith('zh')) {
    const bodyText = stripHtml(html);
    const count = cjkCount(bodyText);
    if (count > 20) fail(`${page.id}: non-Chinese priority page has ${count} CJK characters in rendered body`);
  }
}

if (failures.length) {
  console.error(`SEO QA failed with ${failures.length} issue(s):`);
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`SEO QA passed for ${pages.length} registered pages.`);

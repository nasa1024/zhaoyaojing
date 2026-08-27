import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_URL = 'https://www.aicheck365.com';
export const LOCALIZED_TOOL_LANGS = new Set(['zh-TW', 'ja', 'ko', 'de']);

function routeFromHtmlFile(filePath, distDir) {
  const relative = path.relative(distDir, filePath).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) {
    return `/${relative.slice(0, -'index.html'.length)}`;
  }
  return `/${relative.replace(/\.html$/i, '')}/`;
}

function localeFromPathname(pathname) {
  const [locale] = pathname.split('/').filter(Boolean);
  return LOCALIZED_TOOL_LANGS.has(locale) ? locale : null;
}

function isLocalizedToolPage(pathname, locale) {
  const toolRoot = `/${locale}/tools/`;
  return pathname === toolRoot || pathname.startsWith(toolRoot);
}

function replaceReference(html, from, to) {
  let replacements = 0;
  const variants = [
    [`href="${from}`, `href="${to}`],
    [`href='${from}`, `href='${to}`],
    [`${SITE_URL}${from}`, `${SITE_URL}${to}`],
  ];

  for (const [source, target] of variants) {
    const parts = html.split(source);
    if (parts.length === 1) continue;
    replacements += parts.length - 1;
    html = parts.join(target);
  }

  return { html, replacements };
}

export function rewriteLocalizedToolLinks(html, pathname) {
  const locale = localeFromPathname(pathname);
  if (!locale || isLocalizedToolPage(pathname, locale)) {
    return { html, replacements: 0 };
  }

  const localizedRoot = `/${locale}/tools/`;
  let output = html;
  let replacements = 0;

  for (const legacyRoot of ['/en/tools/', '/tools/']) {
    const result = replaceReference(output, legacyRoot, localizedRoot);
    output = result.html;
    replacements += result.replacements;
  }

  return { html: output, replacements };
}

async function walkHtmlFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtmlFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

export async function rewriteDist(distDir) {
  const files = await walkHtmlFiles(distDir);
  let changedFiles = 0;
  let replacements = 0;

  for (const filePath of files) {
    const pathname = routeFromHtmlFile(filePath, distDir);
    const original = await readFile(filePath, 'utf8');
    const result = rewriteLocalizedToolLinks(original, pathname);
    if (!result.replacements) continue;

    await writeFile(filePath, result.html, 'utf8');
    changedFiles += 1;
    replacements += result.replacements;
  }

  return { scannedFiles: files.length, changedFiles, replacements };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const distDir = path.resolve(process.cwd(), process.argv[2] ?? 'dist');
  const result = await rewriteDist(distDir);
  console.log(
    `Localized ${result.replacements} tool link(s) across ${result.changedFiles} of ${result.scannedFiles} HTML file(s).`,
  );
}

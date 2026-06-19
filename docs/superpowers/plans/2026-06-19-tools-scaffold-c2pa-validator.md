# Tools Scaffold + C2PA Validator Implementation Plan (PR1 of 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the net-new `/tools/` page scaffold plus the first dedicated tool — a C2PA Validator — that surfaces raw provenance data (state, validation issues, manifest fields, assertions, ingredient chain, certificate, raw JSON) the homepage verdict UI never shows, using the EXISTING `verifyC2pa` WASM export (zero new Rust/WASM).

**Architecture:** Four future tool pages will share one scaffold. This PR builds it: a bundled raw-inspector island (`src/scripts/tool-inspector.js`) parameterized by a `data-tool` key, mounted on standalone root-only Astro pages that mirror `methodology.astro`. The C2PA page drives the island via `verifyC2pa(bytes, mime)`. Pages are **root-only and Chinese-body** (per user decision); the language switcher and hreflang are made honest via a new `singleLang` Base prop so they never point at non-existent localized URLs.

**Tech Stack:** Astro 5 (static), vanilla ESM islands bundled by Vite, existing Rust→WASM engine at `/pkg/aicheck.js`, Playwright e2e.

## Global Constraints

- **Truthful output only** (docs/change.md §11, §14.2): every value rendered must come verbatim from the engine's return for the user's actual file. No inferred verdict, no confidence, no guessed fields. Absent data renders as absent, not fabricated.
- **Real independent functionality, no keyword-duplicate pages** (docs/change.md §8, §22.12): the tool must surface raw per-layer data the homepage detector does not. Distinctness is test-enforced (homepage verdict headline must be ABSENT).
- **SSR-static body copy** (docs/change.md §15.1): tool purpose, supported formats, usage, glossary, FAQ, methodology link, limitations, breadcrumbs, internal links, JSON-LD must all be in server-rendered HTML. Only the upload/parse interactivity may be client JS.
- **Routing reality** (verified): `setLang()` NAVIGATES (`public/scripts/i18n.js:1129`), it does not translate body text in place; `detectLang()` (`i18n.js:1112`) force-locks no-prefix URLs to `zh-CN`. Tool pages are therefore zh-CN-body and root-only. Do NOT add tool slugs to `src/pages/[lang]/[...path].astro` (that routes through the hardcoded `LocalizedContentPage` map and would break them). Make hreflang + lang-switch honest instead.
- **`public/sitemap.xml` is a static sitemap index** pointing at the `@astrojs/sitemap`-generated `/sitemap-0.xml`. New `src/pages/tools/*.astro` routes auto-appear in `sitemap-0.xml`. Do not hand-edit `sitemap.xml`.
- **C2PA tool scope:** accept images AND video (`accept="image/*,video/*"`); `verifyC2pa` takes a mime and handles both (user decision).
- **PowerShell tool cwd is `web/`** but inconsistent — use absolute paths or `Set-Location D:\work\zhaoyaojing\web` before `npx playwright test`. Build with `npm run build`; tests run via `npx playwright test` (config does `build && preview`).
- 9 languages: zh-CN (default, un-prefixed) / zh-TW / en / ja / ko / de / fr / es / pt-BR.

## File Structure

- `web/src/layouts/Base.astro` (MODIFY) — add `tools` nav label (9 langs) + 3 nav spots; add `singleLang` prop suppressing localized hreflang; add `data-single-lang` body attr.
- `web/public/scripts/lang-init.js` (MODIFY) — on single-language pages, the lang switch navigates to the localized HOME, never to a 404 localized path.
- `web/src/scripts/tool-inspector.js` (CREATE) — shared bundled raw-inspector island; `TOOL_CONFIG` registry keyed by `data-tool`; C2PA view; filter/copy/export-JSON chrome; lazy WASM loader. Reuses `escapeHtml` from `./format.js`. Never imports `state.js`/`deriveEvidenceState`.
- `web/public/style.css` (MODIFY) — append `.tool-*` global styles (the island injects HTML, so these CANNOT be Astro-scoped).
- `web/src/pages/tools/index.astro` (CREATE) — `/tools/` hub: lists the C2PA validator (live) + the 3 upcoming tools (non-linked), breadcrumb, CollectionPage + BreadcrumbList JSON-LD.
- `web/src/pages/tools/c2pa-validator.astro` (CREATE) — the C2PA validator page: mirrors `methodology.astro`; glossary + FAQ + limitations + methodology link; mounts the island; SoftwareApplication + BreadcrumbList + FAQPage JSON-LD.
- `web/tests/tools.spec.js` (CREATE) — Playwright: SSR-with-JS-disabled, lazy WASM, real-sample analyze, distinctness, sitemap, single-lang hreflang.

---

### Task 1: Nav entry + honest single-language routing in Base

**Files:**
- Modify: `web/src/layouts/Base.astro`
- Modify: `web/public/scripts/lang-init.js`
- Test: `web/tests/tools.spec.js` (created here, expanded in Task 4)

**Interfaces:**
- Produces: `Base` accepts a new optional prop `singleLang?: boolean` (default `false`). When `true`: emits NO `<link rel="alternate" hreflang=...>` tags, and sets `<body data-single-lang="true">`.
- Produces: `NAV_LABELS[lang].tools` exists for all 9 langs; a `nav.tools` `data-i18n` link to `${navPrefix}/tools/` appears in desktop nav, mobile menu, and footer.
- Consumes (Task 3): the tool pages pass `singleLang={true}` to `Base`.

- [ ] **Step 1: Write the failing test** — append to `web/tests/tools.spec.js`:

```js
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE = path.join(__dirname, '../public/samples/verified-ai-credentials.jpg');

test('header exposes a Tools nav link to /tools/', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('.site-nav a[data-i18n="nav.tools"]');
  await expect(link).toHaveAttribute('href', '/tools/');
  await expect(link).toHaveText('工具');
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `Set-Location D:\work\zhaoyaojing\web; npx playwright test tools.spec.js -g "Tools nav link"`
Expected: FAIL (no `a[data-i18n="nav.tools"]` exists yet).

- [ ] **Step 3: Add the `tools` label to all 9 NAV_LABELS blocks** in `web/src/layouts/Base.astro`. Insert a `tools` key into each language object (after its `platforms` key):

```
'zh-CN': { ... tools: '工具', ... }
'zh-TW': { ... tools: '工具', ... }
en:      { ... tools: 'Tools', ... }
ja:      { ... tools: 'ツール', ... }
ko:      { ... tools: '도구', ... }
de:      { ... tools: 'Werkzeuge', ... }
fr:      { ... tools: 'Outils', ... }
es:      { ... tools: 'Herramientas', ... }
'pt-BR': { ... tools: 'Ferramentas', ... }
```

- [ ] **Step 4: Add `toolsHref` and the three nav links** in `web/src/layouts/Base.astro`.

After `const platformsHref = ...` (line ~199) add:

```js
const toolsHref = `${navPrefix}/tools/`;
```

In the desktop `<nav class="site-nav">` (after the platforms link, line ~365) add:

```astro
<a href={toolsHref} class="nav-link" data-i18n="nav.tools">{navLabels.tools}</a>
```

In `<div class="mobile-menu">` (after the platforms mobile link, line ~388) add:

```astro
<a href={toolsHref} class="mobile-link" data-i18n="nav.tools">{navLabels.tools}</a>
```

In `<div class="footer-links">` (after the platforms footer link, line ~402) add:

```astro
<a href={toolsHref} data-i18n="nav.tools">{navLabels.tools}</a>
```

- [ ] **Step 5: Add the `singleLang` prop and honest hreflang.** In the `Props` interface (line ~2) add `singleLang?: boolean;`. In the destructure (line ~12) add `singleLang = false,`.

Replace the hreflang block (lines ~309-312):

```astro
    <link rel="alternate" hreflang="x-default" href={`${SITE_URL}${canonicalPath}`} />
    {SUPPORTED_LANGS.map((lang) => (
      <link rel="alternate" hreflang={lang} href={`${SITE_URL}${localizedPath(canonicalPath, lang)}`} />
    ))}
```

with:

```astro
    {!singleLang && (
      <>
        <link rel="alternate" hreflang="x-default" href={`${SITE_URL}${canonicalPath}`} />
        {SUPPORTED_LANGS.map((lang) => (
          <link rel="alternate" hreflang={lang} href={`${SITE_URL}${localizedPath(canonicalPath, lang)}`} />
        ))}
      </>
    )}
```

Update the body tag (line ~361):

```astro
  <body data-i18n-page={i18nPage} data-single-lang={singleLang ? 'true' : undefined}>
```

- [ ] **Step 6: Make the lang switch honest on single-language pages.** In `web/public/scripts/lang-init.js` replace the lang-switch handler (lines 5-7):

```js
document.getElementById('lang-switch')?.addEventListener('change', (e) => {
  setLang(e.target.value);
});
```

with:

```js
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
```

- [ ] **Step 7: Run the test and verify it passes**

Run: `Set-Location D:\work\zhaoyaojing\web; npx playwright test tools.spec.js -g "Tools nav link"`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add web/src/layouts/Base.astro web/public/scripts/lang-init.js web/tests/tools.spec.js
git commit -m "feat(tools): add Tools nav entry + singleLang honest hreflang/lang-switch"
```

---

### Task 2: Shared bundled raw-inspector island + global tool styles

**Files:**
- Create: `web/src/scripts/tool-inspector.js`
- Modify: `web/public/style.css` (append a `/* ── Tool pages ── */` block at end)
- Test: covered by Task 4 (the island has no DOM to test until Task 3 mounts it).

**Interfaces:**
- Consumes: `escapeHtml` from `./format.js` (already exported, `web/src/scripts/format.js:6`); the WASM export `verifyC2pa(bytes: Uint8Array, mime: string) -> Provenance` at `/pkg/aicheck.js`.
- `Provenance` shape (verified `src/web_c2pa_verify.rs:38-44`): `{ state: "trusted"|"valid"|"invalid"|"unsigned", manifest: {title?, format?, claim_generator?, digital_source_type?, assertions: string[]} | null, validation_status: {code: string, url: string|null, explanation: string|null}[], raw_json: string|null }`.
- Produces: a self-initializing module. On load it finds `#tool-inspector[data-tool]`, reads labels from `#tool-i18n` (JSON), wires the upload UI inside `#tool-inspector`, and renders the raw view into `#tool-output`. `window.__AICHECK_TOOL_LAST__` holds the last raw report (for tests). Mount contract consumed by Task 3:
  - `#tool-inspector[data-tool][data-accept]` wrapper
  - `#tool-file-input` (file input), `#tool-drop-zone` (label), `#tool-status` (status p), `#tool-output` (results div), `#tool-filter` (filter text input), `#tool-copy` (button), `#tool-export` (button)
  - `<script type="application/json" id="tool-i18n">` with keys `{loading, analyzing, done, error, noFile, empty, state, validation, manifest, assertions, ingredients, signature, rawJson, none, filterPlaceholder, copy, copied, export}`

- [ ] **Step 1: Create `web/src/scripts/tool-inspector.js`** with the full module:

```js
// Shared raw-metadata inspector island for /tools/ pages.
// Renders ONLY the verbatim engine return — no verdict, no confidence, no
// A/B/C/D state. Distinct from the homepage Detector by construction:
// it never imports state.js / deriveEvidenceState and renders under .tool-raw-*.
import { escapeHtml as esc } from './format.js';

const wasmModuleUrl = '/pkg/aicheck.js';
let wasmReadyPromise = null;

async function ensureWasm() {
  if (!wasmReadyPromise) {
    wasmReadyPromise = (async () => {
      const pkg = await import(/* @vite-ignore */ wasmModuleUrl);
      if (typeof pkg.default === 'function') await pkg.default();
      pkg.initPanicHook?.();
      return pkg;
    })();
  }
  return wasmReadyPromise;
}

function readLabels() {
  try {
    return JSON.parse(document.getElementById('tool-i18n')?.textContent || '{}');
  } catch {
    return {};
  }
}

function guessMime(name = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    gif: 'image/gif', bmp: 'image/bmp', tif: 'image/tiff', tiff: 'image/tiff',
    mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v', webm: 'video/webm',
  };
  return map[ext] || 'application/octet-stream';
}

// A table row carrying a lowercased data-search index so the filter works.
function row(key, value, kind = 'text') {
  const v = value == null ? '' : String(value);
  const search = `${key} ${v}`.toLowerCase();
  return `<tr data-search="${esc(search)}"><th>${esc(key)}</th><td class="tool-raw-val tool-raw-val--${esc(kind)}">${esc(v)}</td></tr>`;
}

function table(rows) {
  return `<table class="tool-raw-table"><tbody>${rows.join('')}</tbody></table>`;
}

function section(title, inner) {
  if (!inner) return '';
  return `<section class="tool-raw-section"><h3 class="tool-raw-h">${esc(title)}</h3>${inner}</section>`;
}

// Defensively pull the active manifest object from the c2pa reader.json() blob.
function activeManifest(rawJson) {
  if (!rawJson) return null;
  let data;
  try { data = JSON.parse(rawJson); } catch { return null; }
  const id = data.active_manifest;
  if (id && data.manifests && data.manifests[id]) return data.manifests[id];
  // Fall back to the first manifest if active id is absent.
  const first = data.manifests && Object.values(data.manifests)[0];
  return first || null;
}

function renderProvenanceRaw(report, L) {
  const state = report.state || 'unsigned';
  const blocks = [];

  blocks.push(
    `<div class="tool-raw-badge tool-raw-badge--${esc(state)}">${esc(L.state || 'State')}: ${esc(state)}</div>`
  );

  // validation_status
  const vs = Array.isArray(report.validation_status) ? report.validation_status : [];
  if (vs.length) {
    const rows = vs.map((s) =>
      `<tr data-search="${esc(`${s.code || ''} ${s.explanation || ''}`.toLowerCase())}"><th>${esc(s.code || '')}</th><td>${esc(s.explanation || '')}${s.url ? ` <a href="${esc(s.url)}" rel="noopener noreferrer" target="_blank">↗</a>` : ''}</td></tr>`
    );
    blocks.push(section(L.validation || 'Validation', table(rows)));
  }

  // manifest (typed fields)
  const m = report.manifest;
  if (m) {
    const rows = [];
    if (m.title) rows.push(row('title', m.title));
    if (m.format) rows.push(row('format', m.format));
    if (m.claim_generator) rows.push(row('claim_generator', m.claim_generator));
    if (m.digital_source_type) rows.push(row('digitalSourceType', m.digital_source_type));
    if (rows.length) blocks.push(section(L.manifest || 'Manifest', table(rows)));
    const labels = Array.isArray(m.assertions) ? m.assertions : [];
    if (labels.length) {
      const items = labels.map((l) => `<li data-search="${esc(String(l).toLowerCase())}">${esc(l)}</li>`).join('');
      blocks.push(section(L.assertions || 'Assertions', `<ul class="tool-raw-list">${items}</ul>`));
    }
  }

  // ingredients + signature, parsed defensively from raw_json
  const am = activeManifest(report.raw_json);
  if (am) {
    const ingredients = Array.isArray(am.ingredients) ? am.ingredients : [];
    if (ingredients.length) {
      const rows = ingredients.map((ing) =>
        row(ing.title || ing.relationship || 'ingredient', `${ing.relationship || ''} ${ing.format || ''} ${ing.validation_status ? '[' + (Array.isArray(ing.validation_status) ? ing.validation_status.map((x) => x.code).join(',') : ing.validation_status) + ']' : ''}`.trim())
      );
      blocks.push(section(L.ingredients || 'Ingredients', table(rows)));
    }
    const sig = am.signature_info || am.signatureInfo;
    if (sig) {
      const rows = [];
      if (sig.issuer) rows.push(row('issuer', sig.issuer));
      if (sig.cert_serial_number || sig.certSerialNumber) rows.push(row('cert_serial_number', sig.cert_serial_number || sig.certSerialNumber));
      if (sig.time) rows.push(row('time', sig.time));
      if (sig.alg) rows.push(row('alg', sig.alg));
      if (rows.length) blocks.push(section(L.signature || 'Signature / Certificate', table(rows)));
    }
  }

  // raw JSON (ground truth)
  if (report.raw_json) {
    blocks.push(section(L.rawJson || 'Raw manifest JSON', `<pre class="tool-raw-json mono" data-search="${esc(String(report.raw_json).toLowerCase())}">${esc(report.raw_json)}</pre>`));
  }

  if (blocks.length === 1) {
    // only the state badge: no manifest present
    blocks.push(`<p class="tool-raw-empty">${esc(L.none || 'No C2PA manifest found in this file.')}</p>`);
  }
  return blocks.join('');
}

const TOOL_CONFIG = {
  'c2pa-validator': {
    call: (api, bytes, mime) => api.verifyC2pa(bytes, mime),
    view: renderProvenanceRaw,
  },
};

function initToolInspector() {
  const mount = document.querySelector('#tool-inspector');
  if (!mount) return;
  const cfg = TOOL_CONFIG[mount.dataset.tool];
  if (!cfg) return;

  const L = readLabels();
  const fileInput = mount.querySelector('#tool-file-input');
  const dropZone = mount.querySelector('#tool-drop-zone');
  const statusEl = mount.querySelector('#tool-status');
  const outEl = mount.querySelector('#tool-output');
  const filterEl = mount.querySelector('#tool-filter');
  const copyBtn = mount.querySelector('#tool-copy');
  const exportBtn = mount.querySelector('#tool-export');

  let lastReport = null;

  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

  function applyFilter() {
    const q = (filterEl?.value || '').trim().toLowerCase();
    outEl.querySelectorAll('[data-search]').forEach((el) => {
      el.style.display = !q || el.dataset.search.includes(q) ? '' : 'none';
    });
  }

  function render(report) {
    lastReport = report;
    window.__AICHECK_TOOL_LAST__ = report;
    outEl.innerHTML = cfg.view(report, L);
    outEl.classList.remove('hidden');
    if (filterEl) filterEl.value = '';
  }

  async function run(file) {
    if (!file) { setStatus(L.noFile || '请选择文件'); return; }
    try {
      setStatus(L.loading || '正在加载检测引擎…');
      const api = await ensureWasm();
      setStatus(L.analyzing || '正在分析…');
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = file.type || guessMime(file.name);
      const report = await cfg.call(api, bytes, mime);
      render(report);
      setStatus(L.done || '完成');
    } catch (err) {
      console.error(err);
      setStatus((L.error || '错误：') + (err?.message || String(err)));
    }
  }

  fileInput?.addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) run(f);
  });

  ['dragenter', 'dragover'].forEach((n) =>
    dropZone?.addEventListener(n, (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); })
  );
  ['dragleave', 'drop'].forEach((n) =>
    dropZone?.addEventListener(n, (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); })
  );
  dropZone?.addEventListener('drop', (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (f) { fileInput.value = ''; run(f); }
  });

  filterEl?.addEventListener('input', applyFilter);

  copyBtn?.addEventListener('click', () => {
    if (!lastReport) return;
    navigator.clipboard?.writeText(JSON.stringify(lastReport, null, 2)).then(() => {
      copyBtn.textContent = L.copied || '✓';
      setTimeout(() => { copyBtn.textContent = L.copy || 'Copy JSON'; }, 1500);
    }).catch(() => {});
  });

  exportBtn?.addEventListener('click', () => {
    if (!lastReport) return;
    const blob = new Blob([JSON.stringify(lastReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mount.dataset.tool}-report.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  setStatus(L.empty || '选择一个文件开始');
}

initToolInspector();
```

- [ ] **Step 2: Append global tool styles** to the END of `web/public/style.css`:

```css
/* ── Tool pages (raw-metadata inspectors; injected HTML → must be global) ── */
.tool-upload { display: grid; gap: 14px; }
.tool-drop-zone {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 28px; border: 1.5px dashed var(--border); border-radius: 14px;
  cursor: pointer; text-align: center; transition: border-color .15s, background .15s;
}
.tool-drop-zone.drag-over { border-color: var(--accent); background: rgba(110, 168, 255, 0.07); }
.tool-drop-zone input[type="file"] { display: none; }
.tool-toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin: 16px 0 8px; }
.tool-toolbar input[type="text"] { flex: 1 1 220px; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text); }
.tool-raw-section { margin: 18px 0; }
.tool-raw-h { font-size: 15px; margin: 0 0 8px; }
.tool-raw-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.tool-raw-table th { text-align: left; padding: 6px 12px 6px 0; vertical-align: top; white-space: nowrap; color: var(--muted); font-weight: 600; }
.tool-raw-table td { padding: 6px 0; vertical-align: top; word-break: break-word; }
.tool-raw-val--text, .tool-raw-json { font-family: var(--mono, ui-monospace, monospace); }
.tool-raw-list { margin: 0; padding-left: 20px; font-size: 13px; }
.tool-raw-json { white-space: pre-wrap; word-break: break-word; max-height: 420px; overflow: auto; padding: 12px; border-radius: 10px; border: 1px solid var(--border); font-size: 12px; }
.tool-raw-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-weight: 600; font-size: 13px; margin-bottom: 8px; border: 1px solid var(--border); }
.tool-raw-badge--trusted, .tool-raw-badge--valid { background: rgba(74, 222, 128, 0.10); border-color: rgba(74, 222, 128, 0.35); }
.tool-raw-badge--invalid { background: rgba(248, 113, 113, 0.10); border-color: rgba(248, 113, 113, 0.35); }
.tool-raw-badge--unsigned { background: rgba(148, 163, 184, 0.10); }
.tool-raw-empty { color: var(--muted); font-size: 14px; }
.tool-glossary { width: 100%; border-collapse: collapse; font-size: 14px; margin: 8px 0 24px; }
.tool-glossary th, .tool-glossary td { text-align: left; padding: 8px 12px 8px 0; vertical-align: top; border-bottom: 1px solid var(--border); }
.tool-hub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin: 20px 0; }
.tool-hub-card { padding: 18px 20px; border: 1px solid var(--border); border-radius: 14px; }
.tool-hub-card.soon { opacity: 0.6; }
.tool-hub-card h3 { margin: 0 0 6px; font-size: 16px; }
```

- [ ] **Step 3: Build to confirm the island bundles cleanly**

Run: `Set-Location D:\work\zhaoyaojing\web; npm run build`
Expected: build succeeds (the island is not yet imported by a page, so this only verifies `style.css` is valid and the project still builds). The island is exercised in Task 4.

- [ ] **Step 4: Commit**

```bash
git add web/src/scripts/tool-inspector.js web/public/style.css
git commit -m "feat(tools): shared raw-inspector island + global tool styles"
```

---

### Task 3: /tools/ hub + C2PA validator page

**Files:**
- Create: `web/src/pages/tools/index.astro`
- Create: `web/src/pages/tools/c2pa-validator.astro`
- Test: covered by Task 4.

**Interfaces:**
- Consumes: `Base` (`singleLang` prop from Task 1); the island mount contract from Task 2; `escapeHtml` not needed (Astro escapes by default).
- Produces: routes `/tools/` and `/tools/c2pa-validator/` with full SSR body copy + JSON-LD; the C2PA page emits the `#tool-inspector` mount, the `#tool-i18n` JSON blob, and imports the island via `<script>import '../../scripts/tool-inspector.js'</script>`.

- [ ] **Step 1: Create `web/src/pages/tools/index.astro`** (the hub). Mirror `methodology.astro`'s prelude (`SUPPORTED_LANGS`, `getUrlLang`, `urlLang`, `pageLang`, `navPrefix`, `isZh`, `isEn`). Body lists the 4 tools; only C2PA is a live link, the other 3 carry a "coming soon" label (no dead links). Pass `singleLang={true}` to Base.

```astro
---
import Base from '../../layouts/Base.astro';

const SUPPORTED_LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR'];
const DEFAULT_LANG = 'zh-CN';
function getUrlLang(pathname) {
  const seg = pathname.split('/').filter(Boolean)[0];
  return SUPPORTED_LANGS.includes(seg) ? seg : null;
}
const urlLang = getUrlLang(Astro.url.pathname);
const pageLang = urlLang ?? DEFAULT_LANG;
const navPrefix = urlLang && urlLang !== DEFAULT_LANG ? `/${pageLang}` : '';
const isZh = pageLang === 'zh-CN' || pageLang === 'zh-TW';

const title = isZh ? '专用检测工具 | AICheck365' : 'Detection Tools | AICheck365';
const description = isZh
  ? 'AICheck365 的专用取证工具：C2PA 验证器、EXIF/XMP 阅读器、PNG 参数提取器、MP4 元数据检查器。逐层查看文件原始来源数据，全部在浏览器本地完成。'
  : 'AICheck365 forensic tools: C2PA Validator, EXIF/XMP Reader, PNG Parameter Extractor, MP4 Metadata Inspector. Inspect raw per-layer provenance data locally in your browser.';

const tools = [
  { slug: 'c2pa-validator', live: true,
    name: isZh ? 'C2PA 验证器' : 'C2PA Validator',
    desc: isZh ? '检查 C2PA Manifest、签名状态、Claim Generator、Assertions、Ingredient 链、证书与原始 JSON。' : 'Inspect C2PA manifest, signature state, claim generator, assertions, ingredient chain, certificate, and raw JSON.' },
  { slug: 'exif-xmp-reader', live: false,
    name: isZh ? 'EXIF/XMP 阅读器' : 'EXIF/XMP Reader',
    desc: isZh ? '完整列出 EXIF 与 XMP 字段，分类、搜索、复制、导出 JSON。' : 'Full EXIF and XMP field dump with categories, search, copy, and JSON export.' },
  { slug: 'png-parameter-extractor', live: false,
    name: isZh ? 'PNG 参数/工作流提取器' : 'PNG Parameter / Workflow Extractor',
    desc: isZh ? '提取 PNG 文本块、Stable Diffusion 生成参数与 ComfyUI 工作流 JSON。' : 'Extract PNG text chunks, Stable Diffusion parameters, and ComfyUI workflow JSON.' },
  { slug: 'mp4-metadata-inspector', live: false,
    name: isZh ? 'MP4 元数据检查器' : 'MP4 Metadata Inspector',
    desc: isZh ? '查看 MP4/MOV 容器 box 树、编码信息、创建工具、ilst 字段与 SEI marker。' : 'Inspect MP4/MOV box tree, encoding info, creation tool, ilst fields, and SEI markers.' },
];
const soonLabel = isZh ? '即将上线' : 'Coming soon';

const jsonLd = [
  { '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: title, description, url: 'https://www.aicheck365.com/tools/', inLanguage: pageLang },
  { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isZh ? '首页' : 'Home', item: `https://www.aicheck365.com${navPrefix ? navPrefix + '/' : '/'}` },
      { '@type': 'ListItem', position: 2, name: isZh ? '工具' : 'Tools', item: 'https://www.aicheck365.com/tools/' },
    ] },
];
---

<Base title={title} description={description} canonical="https://www.aicheck365.com/tools/" jsonLd={jsonLd} singleLang={true}>
  <main class="page content-page">
    <article class="card content-article">
      <nav class="breadcrumb" aria-label="breadcrumb">
        <a href={navPrefix ? `${navPrefix}/` : '/'}>{isZh ? '首页' : 'Home'}</a>
        <span aria-hidden="true"> › </span>
        <span>{isZh ? '工具' : 'Tools'}</span>
      </nav>
      <h1>{isZh ? '专用检测工具' : 'Detection Tools'}</h1>
      <p class="lead-text">{description}</p>
      <div class="tool-hub-grid">
        {tools.map((tool) => tool.live ? (
          <a class="tool-hub-card" href={`/tools/${tool.slug}/`}>
            <h3>{tool.name} →</h3>
            <p class="muted compact">{tool.desc}</p>
          </a>
        ) : (
          <div class="tool-hub-card soon">
            <h3>{tool.name}</h3>
            <p class="muted compact">{tool.desc}</p>
            <p class="muted compact"><strong>{soonLabel}</strong></p>
          </div>
        ))}
      </div>
      <p><a href="/methodology/">{isZh ? '方法论与限制 →' : 'Methodology & limits →'}</a></p>
    </article>
  </main>
</Base>
```

- [ ] **Step 2: Create `web/src/pages/tools/c2pa-validator.astro`.** Mirror `methodology.astro`: same prelude; a `COPY` object with full zh-CN/zh-TW/en entries and `LANG_H1`/`LANG_TITLE` fallback maps for ja/ko/de/fr/es/pt-BR; SoftwareApplication + BreadcrumbList + FAQPage JSON-LD; the upload mount + `#tool-i18n` blob + island import. Pass `singleLang={true}`.

```astro
---
import Base from '../../layouts/Base.astro';

const SUPPORTED_LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR'];
const DEFAULT_LANG = 'zh-CN';
function getUrlLang(pathname) {
  const seg = pathname.split('/').filter(Boolean)[0];
  return SUPPORTED_LANGS.includes(seg) ? seg : null;
}
const urlLang = getUrlLang(Astro.url.pathname);
const pageLang = urlLang ?? DEFAULT_LANG;
const navPrefix = urlLang && urlLang !== DEFAULT_LANG ? `/${pageLang}` : '';
const isZh = pageLang === 'zh-CN' || pageLang === 'zh-TW';

const COPY = {
  'zh-CN': {
    title: 'C2PA 验证器 | AICheck365',
    description: 'C2PA 验证器：检查文件是否包含 C2PA Manifest，显示签名状态、Claim Generator、Digital Source Type、Assertions、Ingredient 链、证书信息与原始 JSON。本地分析，不上传文件。',
    h1: 'C2PA 验证器',
    lead: '上传图片或视频，逐项查看其 C2PA 内容凭证（Content Credentials）的原始结构：是否存在 Manifest、签名是否通过、由哪个工具签发、包含哪些断言（assertions）、原料链与证书信息，以及完整的原始 JSON。所有解析都在你的浏览器本地完成。',
    usageH: '如何使用',
    usage: ['点击或拖拽一个图片/视频文件到上传区。', '工具会在本地运行 C2PA 校验引擎（首次会加载约 9MB 的 wasm）。', '结果按签名状态、验证问题、Manifest 字段、断言、原料链、证书、原始 JSON 分层展示。', '可搜索字段、复制或导出完整 JSON 以供留存或复核。'],
    glossaryH: '字段含义',
    glossary: [
      ['Manifest', '一份 C2PA 来源声明，记录文件由谁、用什么工具、经过哪些操作生成或编辑。'],
      ['签名状态', 'trusted=证书在信任列表内且有效；valid=密码学有效但证书不在本引擎信任列表；invalid=签名或内容哈希校验失败；unsigned=未发现 C2PA 数据。'],
      ['Claim Generator', '写入该 Manifest 的软件/工具标识。'],
      ['Digital Source Type', 'IPTC 来源类型，如 trainedAlgorithmicMedia 表示完全由 AI 生成。'],
      ['Assertions', 'Manifest 内的断言条目，如创建动作、缩略图、训练来源等。'],
      ['Ingredient 链', '该文件引用的上游素材（原料）及其各自的验证状态。'],
      ['证书 / 签名', '签发者、证书序列号、签名时间与算法。'],
    ],
    limitsH: '适用范围与限制',
    limits: ['未发现 C2PA 数据不代表文件是人类拍摄——多数平台根本不写入 C2PA，且导出、压缩、截图会移除它。', 'valid 表示密码学有效但证书未被本引擎信任，并非伪造证明。', '本工具只读取并展示文件中实际存在的 C2PA 数据，不做任何推断或评分。'],
    faqH: '常见问题',
    faq: [
      { q: '为什么显示 valid 而不是 trusted？', a: '签名密码学上有效，但签发证书不在本引擎的信任根列表内。这很常见（例如厂商使用自有证书），并不代表文件被篡改。' },
      { q: '没有发现 Manifest 是否说明是真人拍摄？', a: '不能。大多数相机和 AI 平台不写入 C2PA，且任何一次导出、压缩、转码或截图都会移除它。无信号只代表“此文件中没有可读的 C2PA 数据”。' },
      { q: '我的文件会被上传吗？', a: '不会。校验完全在你的浏览器本地通过 WebAssembly 运行，文件不会离开你的设备。' },
    ],
    relatedH: '相关',
    methodology: '方法论与限制',
    // island UI labels (rendered into #tool-i18n JSON)
    ui: { loading: '正在加载校验引擎…', analyzing: '正在校验…', done: '完成', error: '错误：', noFile: '请选择文件', empty: '选择一个图片或视频文件开始校验', state: '签名状态', validation: '验证问题', manifest: 'Manifest 字段', assertions: '断言 (Assertions)', ingredients: 'Ingredient 链', signature: '证书 / 签名', rawJson: '原始 Manifest JSON', none: '此文件中未发现 C2PA Manifest。', filterPlaceholder: '搜索字段…', copy: '复制 JSON', copied: '已复制 ✓', export: '导出 JSON' },
    upload: { title: '上传文件校验 C2PA', zone: '点击或拖拽图片/视频到此处', formats: '支持图片与视频（JPEG / PNG / WebP / MP4 / MOV 等）' },
  },
  'zh-TW': {
    title: 'C2PA 驗證器 | AICheck365',
    description: 'C2PA 驗證器：檢查檔案是否包含 C2PA Manifest，顯示簽章狀態、Claim Generator、Digital Source Type、Assertions、Ingredient 鏈、憑證資訊與原始 JSON。本機分析，不上傳檔案。',
    h1: 'C2PA 驗證器',
    lead: '上傳圖片或影片，逐項查看其 C2PA 內容憑證（Content Credentials）的原始結構：是否存在 Manifest、簽章是否通過、由哪個工具簽發、包含哪些斷言、原料鏈與憑證資訊，以及完整的原始 JSON。所有解析都在你的瀏覽器本機完成。',
    usageH: '如何使用',
    usage: ['點擊或拖曳一個圖片/影片檔案到上傳區。', '工具會在本機執行 C2PA 校驗引擎（首次會載入約 9MB 的 wasm）。', '結果按簽章狀態、驗證問題、Manifest 欄位、斷言、原料鏈、憑證、原始 JSON 分層展示。', '可搜尋欄位、複製或匯出完整 JSON。'],
    glossaryH: '欄位含義',
    glossary: [
      ['Manifest', '一份 C2PA 來源聲明，記錄檔案由誰、用什麼工具、經過哪些操作生成或編輯。'],
      ['簽章狀態', 'trusted=憑證在信任清單內且有效；valid=密碼學有效但憑證不在本引擎信任清單；invalid=簽章或內容雜湊校驗失敗；unsigned=未發現 C2PA 資料。'],
      ['Claim Generator', '寫入該 Manifest 的軟體/工具標識。'],
      ['Digital Source Type', 'IPTC 來源類型，如 trainedAlgorithmicMedia 表示完全由 AI 生成。'],
      ['Assertions', 'Manifest 內的斷言條目。'],
      ['Ingredient 鏈', '該檔案引用的上游素材及其各自的驗證狀態。'],
      ['憑證 / 簽章', '簽發者、憑證序號、簽章時間與演算法。'],
    ],
    limitsH: '適用範圍與限制',
    limits: ['未發現 C2PA 資料不代表檔案是真人拍攝。', 'valid 表示密碼學有效但憑證未被本引擎信任，並非偽造證明。', '本工具只讀取並展示檔案中實際存在的 C2PA 資料，不做任何推斷或評分。'],
    faqH: '常見問題',
    faq: [
      { q: '為什麼顯示 valid 而不是 trusted？', a: '簽章密碼學上有效，但簽發憑證不在本引擎的信任根清單內。' },
      { q: '沒有發現 Manifest 是否說明是真人拍攝？', a: '不能。大多數相機和 AI 平台不寫入 C2PA，且匯出、壓縮、轉碼或截圖都會移除它。' },
      { q: '我的檔案會被上傳嗎？', a: '不會。校驗完全在你的瀏覽器本機透過 WebAssembly 執行。' },
    ],
    relatedH: '相關',
    methodology: '方法論與限制',
    ui: { loading: '正在載入校驗引擎…', analyzing: '正在校驗…', done: '完成', error: '錯誤：', noFile: '請選擇檔案', empty: '選擇一個圖片或影片檔案開始校驗', state: '簽章狀態', validation: '驗證問題', manifest: 'Manifest 欄位', assertions: '斷言 (Assertions)', ingredients: 'Ingredient 鏈', signature: '憑證 / 簽章', rawJson: '原始 Manifest JSON', none: '此檔案中未發現 C2PA Manifest。', filterPlaceholder: '搜尋欄位…', copy: '複製 JSON', copied: '已複製 ✓', export: '匯出 JSON' },
    upload: { title: '上傳檔案校驗 C2PA', zone: '點擊或拖曳圖片/影片到此處', formats: '支援圖片與影片（JPEG / PNG / WebP / MP4 / MOV 等）' },
  },
  en: {
    title: 'C2PA Validator | AICheck365',
    description: 'C2PA Validator: check whether a file carries a C2PA manifest and inspect signature state, claim generator, digital source type, assertions, ingredient chain, certificate info, and raw JSON. Analyzed locally, never uploaded.',
    h1: 'C2PA Validator',
    lead: 'Upload an image or video and inspect the raw structure of its C2PA Content Credentials: whether a manifest exists, whether the signature validates, which tool signed it, which assertions it carries, the ingredient chain and certificate info, and the full raw JSON. All parsing happens locally in your browser.',
    usageH: 'How to use',
    usage: ['Click or drag an image/video file onto the upload area.', 'The C2PA verification engine runs locally (a ~9MB wasm loads on first use).', 'Results are grouped by signature state, validation issues, manifest fields, assertions, ingredient chain, certificate, and raw JSON.', 'Search fields, copy, or export the full JSON for your records.'],
    glossaryH: 'Field meanings',
    glossary: [
      ['Manifest', 'A C2PA provenance claim recording who created or edited a file, with which tool, through which actions.'],
      ['Signature state', 'trusted = cert in the trust list and valid; valid = cryptographically valid but cert not in this engine’s trust list; invalid = signature or content-hash check failed; unsigned = no C2PA data found.'],
      ['Claim Generator', 'The software/tool identifier that wrote the manifest.'],
      ['Digital Source Type', 'IPTC source type, e.g. trainedAlgorithmicMedia for fully AI-generated media.'],
      ['Assertions', 'Statements inside the manifest, e.g. creation actions, thumbnails, training source.'],
      ['Ingredient chain', 'Upstream assets this file references, each with its own validation state.'],
      ['Certificate / signature', 'Issuer, certificate serial number, signing time, and algorithm.'],
    ],
    limitsH: 'Scope & limits',
    limits: ['No C2PA data does NOT mean the file is human-made — most platforms never embed it, and export/compression/screenshots strip it.', '"valid" means cryptographically valid with an untrusted cert; it is not proof of forgery.', 'This tool only reads and displays C2PA data actually present in the file; it makes no inference or score.'],
    faqH: 'FAQ',
    faq: [
      { q: 'Why does it say valid instead of trusted?', a: 'The signature is cryptographically valid, but the signing certificate is not in this engine’s trust roots. This is common (e.g. a vendor using its own cert) and does not mean the file was tampered with.' },
      { q: 'Does "no manifest" mean the photo is real?', a: 'No. Most cameras and AI platforms do not embed C2PA, and any export, compression, transcode, or screenshot removes it. No signal only means "no readable C2PA data in this file."' },
      { q: 'Is my file uploaded?', a: 'No. Verification runs entirely in your browser via WebAssembly; the file never leaves your device.' },
    ],
    relatedH: 'Related',
    methodology: 'Methodology & limits',
    ui: { loading: 'Loading verification engine…', analyzing: 'Verifying…', done: 'Done', error: 'Error: ', noFile: 'Please choose a file', empty: 'Choose an image or video file to verify', state: 'Signature state', validation: 'Validation issues', manifest: 'Manifest fields', assertions: 'Assertions', ingredients: 'Ingredient chain', signature: 'Certificate / signature', rawJson: 'Raw manifest JSON', none: 'No C2PA manifest found in this file.', filterPlaceholder: 'Search fields…', copy: 'Copy JSON', copied: 'Copied ✓', export: 'Export JSON' },
    upload: { title: 'Upload a file to validate C2PA', zone: 'Click or drag an image/video here', formats: 'Images and video supported (JPEG / PNG / WebP / MP4 / MOV, etc.)' },
  },
};
const LANG_H1 = { ja: 'C2PA バリデーター', ko: 'C2PA 검증기', de: 'C2PA-Validator', fr: 'Validateur C2PA', es: 'Validador C2PA', 'pt-BR': 'Validador C2PA' };
const LANG_TITLE = { ja: 'C2PA バリデーター | AICheck365', ko: 'C2PA 검증기 | AICheck365', de: 'C2PA-Validator | AICheck365', fr: 'Validateur C2PA | AICheck365', es: 'Validador C2PA | AICheck365', 'pt-BR': 'Validador C2PA | AICheck365' };

const c = COPY[pageLang] ?? { ...COPY.en, h1: LANG_H1[pageLang] ?? COPY.en.h1, title: LANG_TITLE[pageLang] ?? COPY.en.title };

const jsonLd = [
  { '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: 'C2PA Validator', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web browser',
    description: c.description, url: 'https://www.aicheck365.com/tools/c2pa-validator/',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, inLanguage: pageLang },
  { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isZh ? '首页' : 'Home', item: `https://www.aicheck365.com${navPrefix ? navPrefix + '/' : '/'}` },
      { '@type': 'ListItem', position: 2, name: isZh ? '工具' : 'Tools', item: 'https://www.aicheck365.com/tools/' },
      { '@type': 'ListItem', position: 3, name: c.h1, item: 'https://www.aicheck365.com/tools/c2pa-validator/' },
    ] },
  { '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
];
const islandLabels = c.ui;
---

<Base title={c.title} description={c.description} canonical="https://www.aicheck365.com/tools/c2pa-validator/" jsonLd={jsonLd} singleLang={true}>
  <main class="page content-page">
    <article class="card content-article">
      <nav class="breadcrumb" aria-label="breadcrumb">
        <a href={navPrefix ? `${navPrefix}/` : '/'}>{isZh ? '首页' : 'Home'}</a>
        <span aria-hidden="true"> › </span>
        <a href="/tools/">{isZh ? '工具' : 'Tools'}</a>
        <span aria-hidden="true"> › </span>
        <span>{c.h1}</span>
      </nav>
      <h1>{c.h1}</h1>
      <p class="lead-text">{c.lead}</p>

      <!-- ── Interactive island (the ONLY client-JS part) ── -->
      <section id="tool-inspector" data-tool="c2pa-validator" data-accept="image/*,video/*" class="card tool-card">
        <h2>{c.upload.title}</h2>
        <div class="tool-upload">
          <label class="tool-drop-zone" id="tool-drop-zone" for="tool-file-input">
            <input id="tool-file-input" type="file" accept="image/*,video/*" />
            <span class="upload-icon" aria-hidden="true">↥</span>
            <span>{c.upload.zone}</span>
            <small class="muted">{c.upload.formats}</small>
          </label>
          <p id="tool-status" class="status muted" role="status" aria-live="polite"></p>
          <div class="tool-toolbar">
            <input id="tool-filter" type="text" placeholder={c.ui.filterPlaceholder} aria-label={c.ui.filterPlaceholder} />
            <button id="tool-copy" class="ghost">{c.ui.copy}</button>
            <button id="tool-export" class="ghost">{c.ui.export}</button>
          </div>
          <div id="tool-output" class="tool-output hidden"></div>
        </div>
        <noscript><p class="notice warning">{isZh ? '该工具需要 JavaScript 才能在本地校验文件；下方的说明、字段含义和常见问题无需 JavaScript 即可阅读。' : 'This tool needs JavaScript to verify files locally; the explanation, field meanings, and FAQ below are readable without it.'}</p></noscript>
      </section>
      <script type="application/json" id="tool-i18n" set:html={JSON.stringify(islandLabels)} />

      <h2>{c.usageH}</h2>
      <ol class="content-list">{c.usage.map((s) => <li>{s}</li>)}</ol>

      <h2>{c.glossaryH}</h2>
      <table class="tool-glossary"><tbody>{c.glossary.map(([k, v]) => <tr><th>{k}</th><td>{v}</td></tr>)}</tbody></table>

      <h2>{c.limitsH}</h2>
      <ul class="content-list">{c.limits.map((s) => <li>{s}</li>)}</ul>

      <h2>{c.faqH}</h2>
      <dl class="faq-list">{c.faq.map((f) => (<><dt>{f.q}</dt><dd>{f.a}</dd></>))}</dl>

      <h2>{c.relatedH}</h2>
      <ul class="content-list">
        <li><a href="/methodology/">{c.methodology} →</a></li>
        <li><a href="/tools/">{isZh ? '全部专用工具' : 'All detection tools'} →</a></li>
      </ul>
    </article>
  </main>
</Base>

<script>import '../../scripts/tool-inspector.js';</script>
```

- [ ] **Step 3: Build to verify both routes compile**

Run: `Set-Location D:\work\zhaoyaojing\web; npm run build`
Expected: build succeeds; `dist/tools/index.html` and `dist/tools/c2pa-validator/index.html` exist.

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/tools/index.astro web/src/pages/tools/c2pa-validator.astro
git commit -m "feat(tools): /tools/ hub + C2PA validator page (SSR + JSON-LD + island mount)"
```

---

### Task 4: End-to-end Playwright spec (SSR, lazy WASM, real analyze, distinctness, sitemap, hreflang)

**Files:**
- Modify: `web/tests/tools.spec.js` (append the tests below to the file started in Task 1)

**Interfaces:**
- Consumes: the live routes from Task 3 and the island behavior from Task 2 (`window.__AICHECK_TOOL_LAST__`).
- Real fixture: `web/public/samples/verified-ai-credentials.jpg` (Adobe Firefly, valid C2PA → state should be `valid`).

- [ ] **Step 1: Write the tests** — append to `web/tests/tools.spec.js`:

```js
test('C2PA tool body copy is server-rendered (works with JS disabled)', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/tools/c2pa-validator/');
  await expect(page.locator('h1')).toContainText('C2PA');
  await expect(page.getByText('如何使用')).toBeVisible();
  await expect(page.getByText('字段含义')).toBeVisible();
  await expect(page.locator('dl.faq-list dt')).toHaveCount(3);
  await ctx.close();
});

test('C2PA tool does not load the wasm engine until a file is analyzed', async ({ page }) => {
  const wasmRequests = [];
  page.on('request', (r) => { if (r.url().includes('/pkg/aicheck')) wasmRequests.push(r.url()); });
  await page.goto('/tools/c2pa-validator/');
  await page.waitForTimeout(500);
  expect(wasmRequests).toHaveLength(0);
});

test('C2PA tool analyzes a real signed sample and shows raw provenance', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/tools/c2pa-validator/');
  await page.locator('#tool-file-input').setInputFiles(SAMPLE);
  const out = page.locator('#tool-output');
  await expect(out).toBeVisible({ timeout: 80000 });
  // Real engine output: a non-unsigned state badge and the raw manifest JSON.
  await expect(out.locator('.tool-raw-badge')).toContainText('valid');
  await expect(out.locator('.tool-raw-json')).toBeVisible();
  // Truthfulness/export: the last raw report is the exact engine return.
  const state = await page.evaluate(() => window.__AICHECK_TOOL_LAST__?.state);
  expect(['valid', 'trusted', 'invalid']).toContain(state);
});

test('C2PA tool is distinct from the homepage verdict UI (no A/B/C/D verdict)', async ({ page }) => {
  await page.goto('/tools/c2pa-validator/');
  await page.locator('#tool-file-input').setInputFiles(SAMPLE);
  await expect(page.locator('#tool-output')).toBeVisible({ timeout: 80000 });
  await expect(page.locator('.evidence-summary')).toHaveCount(0);
  await expect(page.getByText('检测到 AI 来源信号')).toHaveCount(0);
});

test('tool routes appear in the sitemap', async ({ request }) => {
  const urlset = await request.get('/sitemap-0.xml');
  expect(urlset.ok()).toBeTruthy();
  const text = await urlset.text();
  expect(text).toContain('https://www.aicheck365.com/tools/');
  expect(text).toContain('https://www.aicheck365.com/tools/c2pa-validator/');
});

test('single-language tool page emits no localized hreflang alternates', async ({ page }) => {
  await page.goto('/tools/c2pa-validator/');
  const alts = page.locator('link[rel="alternate"][hreflang]');
  await expect(alts).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href', 'https://www.aicheck365.com/tools/c2pa-validator/'
  );
});
```

- [ ] **Step 2: Run the full spec and verify it fails on the not-yet-verified bits**

Run: `Set-Location D:\work\zhaoyaojing\web; npx playwright test tools.spec.js`
Expected: the SSR/sitemap/hreflang/distinctness tests pass; the "analyzes a real signed sample" test may fail if the raw_json field names assumed by the island's `activeManifest`/signature parsing differ from the real engine output.

- [ ] **Step 3: If the real-sample test fails, inspect the real engine output and fix the parser.** Capture the actual `verifyC2pa` return for the Firefly sample (it is the ground truth for ingredient/signature field names):

```js
// scratch: run in the page console or a throwaway test
const bytes = new Uint8Array(await (await fetch('/samples/verified-ai-credentials.jpg')).arrayBuffer());
const pkg = await import('/pkg/aicheck.js'); await pkg.default();
console.log(JSON.stringify(pkg.verifyC2pa(bytes, 'image/jpeg'), null, 2));
```

Adjust `activeManifest()` and the signature/ingredient field reads in `tool-inspector.js` to match the actual `raw_json` shape. Re-run until green. (The state-badge + raw_json assertions should pass regardless; only the ingredient/signature sub-tables depend on shape, and those are not asserted — so the test should pass once the badge shows `valid`.)

- [ ] **Step 4: Run the entire web test suite to confirm no regressions**

Run: `Set-Location D:\work\zhaoyaojing\web; npx playwright test`
Expected: all tests pass (the prior 57 + the new tools tests).

- [ ] **Step 5: Commit**

```bash
git add web/tests/tools.spec.js web/src/scripts/tool-inspector.js
git commit -m "test(tools): e2e for C2PA validator (SSR, lazy wasm, real analyze, distinctness, sitemap, hreflang)"
```

---

## Self-Review

**Spec coverage (docs/change.md §8.3 — C2PA Validator):**
- 是否存在 Manifest → state badge + `none` message ✓
- 签名状态 → state badge (trusted/valid/invalid/unsigned) ✓
- Claim Generator → manifest field row ✓
- Digital Source Type → manifest field row ✓
- Assertions → assertions list ✓
- Ingredient Chain → ingredients section (parsed from raw_json) ✓
- 证书和签名信息 → signature section (parsed from raw_json) ✓
- 是否存在篡改或验证失败 → validation_status table + invalid state ✓
- 人类可读解释 → glossary + validation explanations ✓
- 原始 JSON 或结构化视图 → raw_json `<pre>` + structured tables ✓
- §15.1 SSR body copy → all prose server-rendered; Task 4 asserts with JS disabled ✓
- §15.5 JSON-LD → SoftwareApplication + BreadcrumbList + FAQPage ✓
- §22.12 distinctness → Task 4 asserts homepage verdict ABSENT ✓
- §11/§14.2 truthful output → island renders only the engine return; export JSON makes it auditable ✓

**Placeholder scan:** No TBD/TODO; all code blocks complete. The only deferred decision is the exact `raw_json` ingredient/signature field names (Task 4 Step 3 resolves it against the real sample) — this is bounded and does not block the asserted tests.

**Type consistency:** Island mount ids (`#tool-inspector`, `#tool-file-input`, `#tool-drop-zone`, `#tool-status`, `#tool-output`, `#tool-filter`, `#tool-copy`, `#tool-export`, `#tool-i18n`) match between `tool-inspector.js` (Task 2) and `c2pa-validator.astro` (Task 3). `islandLabels`/`c.ui` keys match the `L.*` reads in the island. `verifyC2pa(bytes, mime)` signature matches `src/web.rs:252`. `singleLang` prop matches between Base (Task 1) and pages (Task 3). `window.__AICHECK_TOOL_LAST__` set in Task 2, read in Task 4.

## Out of scope (later PRs)
- PR2: C2PA additive WASM enrichment (typed ingredients/signature/assertion bodies) — only if the raw_json client parse proves insufficient.
- PR3: EXIF/XMP Reader (`readExifXmp` export). PR4: MP4 Inspector (`readMp4Metadata`). PR5: PNG Parameter/Workflow Extractor (new Rust parser + sourced real A1111 fixture).
- Each later tool: flip its hub card from `live:false` to a link, add its page + island view + tests.

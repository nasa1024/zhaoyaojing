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

  // Empty state is derived from the data, not from how many blocks were pushed,
  // so reordering/adding blocks above can't silently break this message.
  const hasContent =
    (Array.isArray(report.validation_status) && report.validation_status.length > 0) ||
    Boolean(report.manifest) ||
    Boolean(report.raw_json);
  if (!hasContent) {
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

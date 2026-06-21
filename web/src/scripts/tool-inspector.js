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

function ga(name, params = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

function cleanToken(value, fallback = 'unknown') {
  const cleaned = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  return cleaned || fallback;
}

function pageLocale() {
  const htmlLang = document.documentElement?.lang || '';
  return cleanToken(htmlLang || 'zh-CN');
}

function mimeGroup(mime = '') {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/octet-stream') return 'unknown';
  return 'other';
}

function fileCategory(file) {
  return mimeGroup(file?.type || guessMime(file?.name || ''));
}

function fileCountBucket(count) {
  if (count <= 1) return '1';
  if (count <= 3) return '2-3';
  if (count <= 10) return '4-10';
  return '11+';
}

function durationBucket(ms) {
  if (ms < 1000) return '<1s';
  if (ms < 3000) return '1-3s';
  if (ms < 10000) return '3-10s';
  return '10s+';
}

function resultCategory(report) {
  const state = cleanToken(report?.state || '', '');
  if (state) return `c2pa_${state}`;
  if (report?.supported === false) return 'unsupported';
  if (Array.isArray(report?.signals) && report.signals.length) return 'signals_found';
  if ((Array.isArray(report?.fields) && report.fields.length) || (Array.isArray(report?.blobs) && report.blobs.length)) return 'metadata_found';
  return 'empty';
}

function sanitizedErrorCode(err) {
  return cleanToken(err?.name || err?.constructor?.name || 'error', 'error');
}

function trackDetectorView(mount, toolType) {
  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    ga('detector_view', { locale: pageLocale(), page_type: 'tool', tool_type: toolType });
  };

  if (typeof IntersectionObserver !== 'function') {
    fire();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      fire();
      observer.disconnect();
    }
  }, { threshold: 0.2 });
  observer.observe(mount);
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

function badge(text, tone = 'neutral') {
  return `<span class="tool-raw-badge tool-raw-badge--${esc(tone)}">${esc(text)}</span>`;
}

function groupedFields(fields = []) {
  const groups = new Map();
  for (const field of fields) {
    const group = field.group || 'Fields';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(field);
  }
  return [...groups.entries()].map(([group, rows]) => {
    const body = rows.map((field) => {
      const flags = [
        field.ai_related ? '<span class="tool-pill tool-pill--ai">AI</span>' : '',
        field.sensitive ? '<span class="tool-pill tool-pill--sensitive">Sensitive</span>' : '',
      ].filter(Boolean).join(' ');
      const key = flags ? `${esc(field.key || '')} ${flags}` : esc(field.key || '');
      const source = field.source ? `<small class="tool-source">${esc(field.source)}</small>` : '';
      return `<tr data-search="${esc(`${field.key || ''} ${field.value || ''} ${field.source || ''} ${group}`.toLowerCase())}"><th>${key}${source}</th><td class="tool-raw-val tool-raw-val--text">${esc(field.value ?? '')}</td></tr>`;
    });
    return section(group, table(body));
  }).join('');
}

function renderSignals(signals = [], L) {
  if (!Array.isArray(signals) || !signals.length) return '';
  const rows = signals.map((signal) => {
    const details = Array.isArray(signal.details)
      ? signal.details.map((d) => `${d.key}: ${d.value}`).join(' | ')
      : '';
    return `<tr data-search="${esc(`${signal.source || ''} ${signal.confidence || ''} ${signal.description || ''} ${signal.tool || ''} ${details}`.toLowerCase())}"><th>${esc(signal.source || '')}<small class="tool-source">${esc(signal.confidence || '')}</small></th><td>${esc(signal.description || '')}${signal.tool ? ` <span class="tool-pill tool-pill--ai">${esc(signal.tool)}</span>` : ''}${details ? `<div class="tool-detail">${esc(details)}</div>` : ''}</td></tr>`;
  });
  return section(L.signals || 'AI-related signals', table(rows));
}

function renderBlobs(blobs = [], L) {
  if (!Array.isArray(blobs) || !blobs.length) return '';
  const items = blobs.map((blob, idx) => {
    const flags = [
      blob.kind ? `<span class="tool-pill">${esc(blob.kind)}</span>` : '',
      blob.ai_related ? '<span class="tool-pill tool-pill--ai">AI</span>' : '',
      blob.sensitive ? '<span class="tool-pill tool-pill--sensitive">Sensitive</span>' : '',
    ].filter(Boolean).join(' ');
    return `<details class="tool-blob" data-search="${esc(`${blob.title || ''} ${blob.kind || ''} ${blob.value || ''}`.toLowerCase())}" ${idx === 0 ? 'open' : ''}>
      <summary>${esc(blob.title || (L.rawData || 'Raw data'))} ${flags}</summary>
      <pre class="tool-raw-json mono">${esc(blob.value || '')}</pre>
    </details>`;
  }).join('');
  return section(L.rawData || 'Raw data', items);
}

function renderInspectorRaw(report, L) {
  const blocks = [];
  const summary = Array.isArray(report.summary) ? report.summary : [];
  if (summary.length) {
    blocks.push(`<div class="tool-summary">${summary.map((s) => badge(s, report.supported === false ? 'unsigned' : 'valid')).join('')}</div>`);
  }
  const warnings = Array.isArray(report.warnings) ? report.warnings : [];
  if (warnings.length) {
    blocks.push(section(L.warnings || 'Warnings', `<ul class="tool-raw-list">${warnings.map((w) => `<li data-search="${esc(w.toLowerCase())}">${esc(w)}</li>`).join('')}</ul>`));
  }
  blocks.push(renderSignals(report.signals, L));
  blocks.push(groupedFields(report.fields));
  blocks.push(renderBlobs(report.blobs, L));

  const hasContent =
    summary.length ||
    warnings.length ||
    (Array.isArray(report.fields) && report.fields.length) ||
    (Array.isArray(report.blobs) && report.blobs.length) ||
    (Array.isArray(report.signals) && report.signals.length);
  if (!hasContent) blocks.push(`<p class="tool-raw-empty">${esc(L.none || 'No readable metadata found.')}</p>`);
  return blocks.join('');
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

function validationProblemLabel(issue, L) {
  const text = `${issue?.code || ''} ${issue?.explanation || ''}`.toLowerCase();
  if (text.includes('expired')) return L.problemExpired || 'Certificate expired';
  if (text.includes('hash') && text.includes('mismatch')) return L.problemHashMismatch || 'Content hash mismatch';
  if (text.includes('untrusted')) return L.problemUntrusted || 'Signer is not in the trust list';
  if (text.includes('parse') || text.includes('jumbf') || text.includes('malformed')) return L.problemParse || 'Manifest parse error';
  if (text.includes('signature')) return L.problemSignature || 'Signature validation issue';
  return issue?.code || L.problemUnknown || 'Validation issue';
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function provenanceSummary(report, L) {
  const state = report.state || 'unsigned';
  const issues = Array.isArray(report.validation_status) ? report.validation_status : [];
  const hasManifest = Boolean(report.manifest || report.raw_json || issues.length);
  const problems = unique(issues.map((issue) => validationProblemLabel(issue, L)));

  const signatureValidity =
    state === 'trusted' || state === 'valid'
      ? (L.signatureValid || 'Cryptographically valid')
      : state === 'invalid'
        ? (L.signatureInvalid || 'Invalid or unverifiable')
        : (L.signatureNotFound || 'No C2PA signature found');

  const trustStatus =
    state === 'trusted'
      ? (L.trustTrusted || 'Signer trusted by this engine')
      : state === 'valid'
        ? (L.trustUnlisted || 'Signature valid, signer not trusted here')
        : state === 'invalid'
          ? (problems.length ? problems.join(' | ') : (L.trustInvalid || 'Trust could not be established'))
          : (L.trustNone || 'No signer to evaluate');

  return [
    [L.manifestPresence || 'Manifest', hasManifest ? (L.manifestFound || 'Found') : (L.manifestMissing || 'Not found')],
    [L.signatureValidity || 'Signature validity', signatureValidity],
    [L.trustStatus || 'Trust status', trustStatus],
    [L.problemSummary || 'Problem summary', problems.length ? problems.join(' | ') : (state === 'unsigned' ? (L.noManifestProblem || 'No readable C2PA manifest') : (L.noValidationProblems || 'No validation problem reported'))],
  ];
}

function renderProvenanceSummary(report, L) {
  const rows = provenanceSummary(report, L).map(([key, value]) => row(key, value));
  return section(L.statusSummary || 'Status summary', `<div class="tool-state-summary">${table(rows)}</div>`);
}

function renderProvenanceRaw(report, L) {
  const state = report.state || 'unsigned';
  const blocks = [];

  blocks.push(
    `<div class="tool-raw-badge tool-raw-badge--${esc(state)}">${esc(L.state || 'State')}: ${esc(state)}</div>`
  );
  blocks.push(renderProvenanceSummary(report, L));

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
  'exif-xmp-reader': {
    call: (api, bytes) => api.inspectExifXmp(bytes),
    view: renderInspectorRaw,
  },
  'png-parameter-extractor': {
    call: (api, bytes) => api.inspectPngMetadata(bytes),
    view: renderInspectorRaw,
  },
  'mp4-metadata-inspector': {
    call: (api, bytes) => api.inspectMp4Metadata(bytes),
    view: renderInspectorRaw,
  },
};

function initToolInspector() {
  const mount = document.querySelector('#tool-inspector');
  if (!mount) return;
  const cfg = TOOL_CONFIG[mount.dataset.tool];
  if (!cfg) return;
  const toolType = cleanToken(mount.dataset.tool);
  trackDetectorView(mount, toolType);

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
    const startedAt = performance.now();
    const category = fileCategory(file);
    try {
      setStatus(L.loading || '正在加载检测引擎…');
      const api = await ensureWasm();
      setStatus(L.analyzing || '正在分析…');
      ga('analysis_start', { tool_type: toolType });
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = file.type || guessMime(file.name);
      const report = await cfg.call(api, bytes, mime);
      render(report);
      ga('analysis_complete', {
        result_category: resultCategory(report),
        duration_bucket: durationBucket(performance.now() - startedAt),
        file_category: category,
      });
      setStatus(L.done || '完成');
    } catch (err) {
      console.error(err);
      setStatus((L.error || '错误：') + (err?.message || String(err)));
      ga('analysis_error', {
        sanitized_error_code: sanitizedErrorCode(err),
        file_category: category,
      });
    }
  }

  fileInput?.addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) {
      ga('file_select', {
        file_category: fileCategory(f),
        mime_group: mimeGroup(f.type || guessMime(f.name)),
        file_count_bucket: fileCountBucket(e.target.files?.length || 1),
      });
      run(f);
    }
  });

  ['dragenter', 'dragover'].forEach((n) =>
    dropZone?.addEventListener(n, (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); })
  );
  ['dragleave', 'drop'].forEach((n) =>
    dropZone?.addEventListener(n, (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); })
  );
  dropZone?.addEventListener('drop', (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      ga('file_select', {
        file_category: fileCategory(f),
        mime_group: mimeGroup(f.type || guessMime(f.name)),
        file_count_bucket: fileCountBucket(e.dataTransfer?.files?.length || 1),
      });
      fileInput.value = '';
      run(f);
    }
  });

  filterEl?.addEventListener('input', applyFilter);

  function hasSensitiveReportData(report) {
    return Boolean(
      report &&
      (
        (Array.isArray(report.fields) && report.fields.some((f) => f.sensitive)) ||
        (Array.isArray(report.blobs) && report.blobs.some((b) => b.sensitive))
      )
    );
  }

  function safeCopyPayload(report) {
    if (!report || !Array.isArray(report.fields)) return report;
    return {
      tool: report.tool,
      parser_version: report.parser_version,
      mime_type: report.mime_type,
      media_type: report.media_type,
      supported: report.supported,
      summary: report.summary || [],
      warnings: report.warnings || [],
      fields: report.fields.filter((field) => !field.sensitive),
      signals: report.signals || [],
      note: 'Sensitive fields and raw blobs are omitted from this copied summary.',
    };
  }

  copyBtn?.addEventListener('click', () => {
    if (!lastReport) return;
    navigator.clipboard?.writeText(JSON.stringify(safeCopyPayload(lastReport), null, 2)).then(() => {
      ga('copy_result', { copy_type: 'json_summary' });
      copyBtn.textContent = L.copied || '✓';
      setTimeout(() => { copyBtn.textContent = L.copy || 'Copy JSON'; }, 1500);
    }).catch(() => {});
  });

  exportBtn?.addEventListener('click', () => {
    if (!lastReport) return;
    if (hasSensitiveReportData(lastReport)) {
      const ok = window.confirm(L.sensitiveExport || 'This export may include sensitive metadata such as GPS, author/contact data, prompts, or workflow JSON. Continue?');
      if (!ok) return;
    }
    const blob = new Blob([JSON.stringify(lastReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mount.dataset.tool}-report.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    ga('export_result', { export_type: 'json_full' });
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  setStatus(L.empty || '选择一个文件开始');
}

initToolInspector();

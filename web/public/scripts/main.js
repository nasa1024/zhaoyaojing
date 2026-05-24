import { t, applyI18n, setLang } from '/scripts/i18n.js';

// ─── DOM refs ────────────────────────────────────────────────────
const fileInput      = document.querySelector('#file-input');
const analyzeBtn     = document.querySelector('#analyze-btn');
const statusEl       = document.querySelector('#status');
const reportEl       = document.querySelector('#report');
const emptyStateEl   = document.querySelector('#empty-state');
const platformListEl = document.querySelector('#platform-list');
const formatListEl   = document.querySelector('#format-list');
const signalTypesEl  = document.querySelector('#signal-types');
const fileMetaEl     = document.querySelector('#file-meta');
const uploadZoneEl   = document.querySelector('#upload-zone');
const langBtn        = document.querySelector('#lang-switch');
const historyListEl  = document.querySelector('#history-list');
const themeBtn       = document.getElementById('theme-toggle');
const hamburger      = document.getElementById('hamburger');
const mobileMenu     = document.getElementById('mobile-menu');

let wasmApi       = null;
let selectedFiles = [];
let isAnalyzing   = false;

// ─── Init ────────────────────────────────────────────────────────
applyI18n();
applyTheme(localStorage.getItem('theme') ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
renderHistory();

langBtn?.addEventListener('change', (e) => setLang(e.target.value));

document.addEventListener('langchange', () => {
  syncAnalyzeButton();
  if (selectedFiles.length) renderSelectedFiles(selectedFiles);
  if (!reportEl.classList.contains('hidden') && reportEl._lastReports) {
    renderReports(reportEl._lastReports);
  }
});

boot();

async function boot() {
  try {
    const pkg = await import('/pkg/aicheck.js');
    if (typeof pkg.default === 'function') await pkg.default();
    pkg.initPanicHook?.();
    wasmApi = pkg;

    const capabilities = await wasmApi.supportedImageCapabilities();
    renderCapabilities(capabilities);
    setStatus(t('status.ready'));
    syncAnalyzeButton();
  } catch (error) {
    console.error(error);
    setStatus(t('status.error'), true);
  }
}

// ─── GA4 helper ──────────────────────────────────────────────────
function ga(name, params = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

// ─── File selection ──────────────────────────────────────────────
fileInput.addEventListener('change', (event) => {
  const files = Array.from(event.target.files || []);
  selectedFiles = files.filter(isSupportedImage);
  if (selectedFiles.length) {
    ga('file_select', { file_count: selectedFiles.length, file_type: selectedFiles[0].type });
  }
  renderSelectedFiles(selectedFiles);
  syncAnalyzeButton();
});

['dragenter', 'dragover'].forEach((name) => {
  uploadZoneEl.addEventListener(name, (e) => {
    e.preventDefault();
    uploadZoneEl.classList.add('drag-over');
  });
});
['dragleave', 'drop'].forEach((name) => {
  uploadZoneEl.addEventListener(name, (e) => {
    e.preventDefault();
    uploadZoneEl.classList.remove('drag-over');
  });
});

uploadZoneEl.addEventListener('drop', (event) => {
  const files = Array.from(event.dataTransfer?.files || []);
  const valid = files.filter(isSupportedImage);
  if (!valid.length) { setStatus(t('status.unsupported'), true); return; }
  selectedFiles = valid;
  fileInput.value = '';
  renderSelectedFiles(valid);
  syncAnalyzeButton();
});

// ─── Analyze ─────────────────────────────────────────────────────
analyzeBtn.addEventListener('click', async () => {
  if (!wasmApi)            { setStatus(t('status.error'), true); return; }
  if (!selectedFiles.length) { setStatus(t('status.no_file'), true); return; }

  try {
    isAnalyzing = true;
    syncAnalyzeButton();
    setStatus(t('status.analyzing'));
    ga('analyze_start', { file_count: selectedFiles.length });

    const results = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setStatus(`${t('status.analyzing')} (${i + 1}/${selectedFiles.length})`);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const report = await wasmApi.analyzeImage(bytes, file.name);
      results.push({ file, report });
    }

    const aiCount = results.filter(r => r.report.ai_generated).length;
    ga('analyze_complete', {
      file_count: results.length,
      ai_detected: aiCount,
      has_signals: aiCount > 0,
    });

    renderReports(results);
    saveHistory(results);
    renderHistory();
    setStatus(t('status.done'));
  } catch (error) {
    console.error(error);
    setStatus(error?.message || String(error), true);
  } finally {
    isAnalyzing = false;
    syncAnalyzeButton();
  }
});

// ─── Render: capabilities ────────────────────────────────────────
function renderCapabilities(capabilities) {
  platformListEl.classList.remove('skeleton-list');
  formatListEl.classList.remove('skeleton-list');
  signalTypesEl.classList.remove('skeleton-list');
  renderTags(platformListEl, capabilities.supported_platforms || []);
  renderTags(formatListEl, capabilities.supported_formats || []);
  renderBullets(signalTypesEl, capabilities.supported_signal_types || []);
}

// ─── Render: selected files ──────────────────────────────────────
function renderSelectedFiles(files) {
  if (!files.length) {
    fileMetaEl.classList.add('hidden');
    fileMetaEl.innerHTML = '';
    setStatus(t('status.no_file'));
    return;
  }
  fileMetaEl.classList.remove('hidden');
  if (files.length === 1) {
    const file = files[0];
    fileMetaEl.innerHTML = `
      <div>
        <strong>${escapeHtml(file.name)}</strong>
        <span>${escapeHtml(file.type || 'unknown')}</span>
      </div>
      <span>${escapeHtml(formatBytes(file.size))}</span>
    `;
  } else {
    const total = files.reduce((s, f) => s + f.size, 0);
    fileMetaEl.innerHTML = `
      <div>
        <strong>${files.length} ${t('upload.files.selected') || 'files selected'}</strong>
        <span>${files.map(f => escapeHtml(f.name)).join(', ')}</span>
      </div>
      <span>${escapeHtml(formatBytes(total))}</span>
    `;
  }
  setStatus((t('status.selected') || 'Selected: ') + files.map(f => f.name).join(', '));
}

// ─── Render: multi-file reports ──────────────────────────────────
function renderReports(results) {
  reportEl._lastReports = results;
  emptyStateEl.classList.add('hidden');
  reportEl.classList.remove('hidden');

  if (results.length === 1) {
    renderSingleReport(results[0].report);
    return;
  }

  // Summary bar for batch
  const aiCount = results.filter(r => r.report.ai_generated).length;
  const summaryHtml = `
    <div class="batch-summary">
      <strong>${results.length} ${t('batch.files') || 'files'}</strong> —
      <span class="badge ${aiCount > 0 ? 'high' : 'none'}">${aiCount} ${t('batch.ai_detected') || 'AI signals detected'}</span>
      <button class="share-btn" id="share-btn">${t('share.button') || '📋 Copy Report'}</button>
    </div>
    <div class="batch-results">
      ${results.map((r, i) => `
        <details class="batch-item" ${i === 0 ? 'open' : ''}>
          <summary class="batch-item-header">
            <span class="badge ${r.report.overall_confidence || 'none'}">${escapeHtml(labelForConfidence(r.report.overall_confidence))}</span>
            <span class="batch-item-name">${escapeHtml(r.file.name)}</span>
          </summary>
          <div class="batch-item-body">${buildReportHtml(r.report)}</div>
        </details>
      `).join('')}
    </div>
  `;
  reportEl.innerHTML = summaryHtml;
  document.getElementById('share-btn')?.addEventListener('click', () => copyReport(results));
}

function renderSingleReport(report) {
  reportEl.innerHTML = `
    <div class="report-header">
      <span class="badge ${escapeHtml(report.overall_confidence || 'none')}">${escapeHtml(labelForConfidence(report.overall_confidence))}</span>
      <strong>${escapeHtml(report.ai_generated ? t('report.ai_yes') : t('report.ai_no'))}</strong>
      <button class="share-btn" id="share-btn">${t('share.button') || '📋 Copy Report'}</button>
    </div>
    ${buildReportHtml(report)}
  `;
  document.getElementById('share-btn')?.addEventListener('click', () => copyReport([{ report }]));
}

function buildReportHtml(report) {
  const signals = report.signals || [];
  const signalCards = signals.length
    ? signals.map(renderSignalCard).join('')
    : `<div class="empty-state success-state">${escapeHtml(t('report.no_signals'))}</div>`;

  const limitations = (report.limitations || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('') || `<li>${escapeHtml(t('report.no_limitations'))}</li>`;

  return `
    <div class="summary-grid">
      <div class="summary-item">
        <div class="label">${escapeHtml(t('report.label.filename'))}</div>
        <div class="value">${escapeHtml(report.file_name || '—')}</div>
      </div>
      <div class="summary-item">
        <div class="label">${escapeHtml(t('report.label.mime'))}</div>
        <div class="value">${escapeHtml(report.mime_type || 'unknown')}</div>
      </div>
      <div class="summary-item">
        <div class="label">${escapeHtml(t('report.label.mode'))}</div>
        <div class="value">${escapeHtml(report.mode || 'browser-image')}</div>
      </div>
      <div class="summary-item">
        <div class="label">${escapeHtml(t('report.label.signals'))}</div>
        <div class="value">${signals.length}</div>
      </div>
    </div>
    <h3>${escapeHtml(t('report.heading.signals'))}</h3>
    <div class="signal-list">${signalCards}</div>
    <h3>${escapeHtml(t('report.heading.limits'))}</h3>
    <ul class="limitation-list">${limitations}</ul>
  `;
}

function renderSignalCard(signal) {
  const detailItems = (signal.details || [])
    .map((d) => `<li><strong>${escapeHtml(d.key)}：</strong>${escapeHtml(d.value)}</li>`)
    .join('');
  return `
    <article class="signal-card">
      <div class="signal-meta">
        <span class="signal-source">${escapeHtml(signal.source || 'UNKNOWN')}</span>
        <span class="badge ${escapeHtml(signal.confidence || 'low')}">${escapeHtml(labelForConfidence(signal.confidence))}</span>
        ${signal.tool ? `<span class="tag-inline">${escapeHtml(signal.tool)}</span>` : ''}
      </div>
      <div>${escapeHtml(signal.description || '')}</div>
      ${detailItems ? `<ul class="detail-list">${detailItems}</ul>` : ''}
    </article>
  `;
}

// ─── History ─────────────────────────────────────────────────────
const HISTORY_KEY = 'aicheck_history';
const HISTORY_MAX = 10;

function saveHistory(results) {
  const existing = loadHistoryRaw();
  const newItems = results.map(({ file, report }) => ({
    name: file.name,
    size: file.size,
    confidence: report.overall_confidence || 'none',
    ai: report.ai_generated,
    signals: (report.signals || []).length,
    ts: Date.now(),
    report,
  }));
  const merged = [...newItems, ...existing].slice(0, HISTORY_MAX);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(merged)); } catch {}
}

function loadHistoryRaw() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function renderHistory() {
  if (!historyListEl) return;
  const items = loadHistoryRaw();
  if (!items.length) {
    historyListEl.innerHTML = `<p class="history-empty">${t('history.empty') || 'No recent detections.'}</p>`;
    return;
  }
  historyListEl.innerHTML = items.map((item, idx) => `
    <div class="history-item" data-idx="${idx}" role="button" tabindex="0">
      <span class="badge ${escapeHtml(item.confidence)}">${escapeHtml(labelForConfidence(item.confidence))}</span>
      <span class="history-name">${escapeHtml(item.name)}</span>
      <span class="history-time">${timeAgo(item.ts)}</span>
    </div>
  `).join('');

  historyListEl.querySelectorAll('.history-item').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.idx);
      const item = loadHistoryRaw()[idx];
      if (!item?.report) return;
      emptyStateEl.classList.add('hidden');
      reportEl.classList.remove('hidden');
      renderSingleReport(item.report);
      reportEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ─── Share / copy ────────────────────────────────────────────────
function copyReport(results) {
  const btn = document.getElementById('share-btn');
  const lines = results.map(({ file, report }) => {
    const signals = (report.signals || []).map(s => `  • [${s.confidence?.toUpperCase()}] ${s.description}`).join('\n');
    return [
      `File: ${report.file_name || file?.name || '—'}`,
      `Result: ${report.ai_generated ? 'AI signals detected' : 'No AI signals found'}`,
      `Confidence: ${(report.overall_confidence || 'none').toUpperCase()}`,
      `Signals: ${(report.signals || []).length}`,
      signals ? `\nSignals:\n${signals}` : '',
      `\nAnalyzed by AICheck365 (aicheck365.com)`,
    ].filter(Boolean).join('\n');
  }).join('\n\n---\n\n');

  navigator.clipboard.writeText(lines).then(() => {
    if (btn) {
      btn.textContent = t('share.copied') || '✓ Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = t('share.button') || '📋 Copy Report';
        btn.classList.remove('copied');
      }, 2000);
    }
  }).catch(() => {});
}

// ─── Utils ───────────────────────────────────────────────────────
function renderTags(container, items) {
  container.innerHTML = items.length
    ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
    : `<li>${escapeHtml(t('skeleton'))}</li>`;
}

function renderBullets(container, items) {
  container.innerHTML = items.length
    ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
    : `<li>${escapeHtml(t('skeleton'))}</li>`;
}

function syncAnalyzeButton() {
  analyzeBtn.disabled = !wasmApi || !selectedFiles.length || isAnalyzing;
  analyzeBtn.textContent = isAnalyzing ? t('btn.running') : t('btn.idle');
}

function isSupportedImage(file) {
  return /^image\/(jpeg|png|webp|gif|bmp|tiff)$/.test(file.type)
    || /\.(jpe?g|png|webp|gif|bmp|tiff?)$/i.test(file.name);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024, i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[i]}`;
}

function labelForConfidence(confidence) {
  switch ((confidence || '').toLowerCase()) {
    case 'high':   return 'HIGH';
    case 'medium': return 'MEDIUM';
    case 'low':    return 'LOW';
    default:       return 'NONE';
  }
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('muted', !isError);
  statusEl.classList.toggle('error', isError);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ─── Theme ───────────────────────────────────────────────────────
function applyTheme(theme) {
  document.body.dataset.theme = theme;
  if (themeBtn) themeBtn.textContent = theme === 'light' ? '☽' : '☀';
  localStorage.setItem('theme', theme);
}

themeBtn?.addEventListener('click', () => {
  applyTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light');
});

// ─── Hamburger ───────────────────────────────────────────────────
hamburger?.addEventListener('click', () => {
  const expanded = hamburger.getAttribute('aria-expanded') === 'true';
  hamburger.setAttribute('aria-expanded', String(!expanded));
  mobileMenu?.classList.toggle('open', !expanded);
  mobileMenu?.setAttribute('aria-hidden', String(expanded));
});

document.addEventListener('click', (e) => {
  if (hamburger && mobileMenu && !hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }
});

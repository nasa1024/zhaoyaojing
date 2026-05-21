import { t, applyI18n, getCurrentLang, setLang } from './i18n.js';

const fileInput    = document.querySelector('#file-input');
const analyzeBtn   = document.querySelector('#analyze-btn');
const statusEl     = document.querySelector('#status');
const reportEl     = document.querySelector('#report');
const emptyStateEl = document.querySelector('#empty-state');
const platformListEl = document.querySelector('#platform-list');
const formatListEl   = document.querySelector('#format-list');
const signalTypesEl  = document.querySelector('#signal-types');
const fileMetaEl     = document.querySelector('#file-meta');
const uploadZoneEl   = document.querySelector('#upload-zone');
const langBtn        = document.querySelector('#lang-switch');

let wasmApi = null;
let selectedFile = null;
let isAnalyzing = false;

// Apply saved/detected language on load
applyI18n();

// Language switcher
langBtn?.addEventListener('click', () => {
  setLang(getCurrentLang() === 'zh-CN' ? 'en' : 'zh-CN');
});

// Re-render dynamic UI when language changes
document.addEventListener('langchange', () => {
  syncAnalyzeButton();
  if (selectedFile) {
    renderSelectedFile(selectedFile);
  }
  // Re-render report if visible
  if (!reportEl.classList.contains('hidden') && reportEl._lastReport) {
    renderReport(reportEl._lastReport);
  }
});

boot();

async function boot() {
  try {
    const pkg = await import('./pkg/aicheck.js');
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

fileInput.addEventListener('change', (event) => {
  selectedFile = event.target.files?.[0] || null;
  renderSelectedFile(selectedFile);
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
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  if (!isSupportedImage(file)) {
    setStatus(t('status.unsupported'), true);
    return;
  }
  selectedFile = file;
  fileInput.value = '';
  renderSelectedFile(file);
  syncAnalyzeButton();
});

analyzeBtn.addEventListener('click', async () => {
  if (!wasmApi)      { setStatus(t('status.error'), true); return; }
  if (!selectedFile) { setStatus(t('status.no_file'), true); return; }

  try {
    isAnalyzing = true;
    syncAnalyzeButton();
    setStatus(t('status.analyzing'));
    const bytes = new Uint8Array(await selectedFile.arrayBuffer());
    const report = await wasmApi.analyzeImage(bytes, selectedFile.name);
    renderReport(report);
    setStatus(t('status.done'));
  } catch (error) {
    console.error(error);
    setStatus(error?.message || String(error), true);
  } finally {
    isAnalyzing = false;
    syncAnalyzeButton();
  }
});

function renderCapabilities(capabilities) {
  platformListEl.classList.remove('skeleton-list');
  formatListEl.classList.remove('skeleton-list');
  signalTypesEl.classList.remove('skeleton-list');
  renderTags(platformListEl, capabilities.supported_platforms || []);
  renderTags(formatListEl, capabilities.supported_formats || []);
  renderBullets(signalTypesEl, capabilities.supported_signal_types || []);
}

function renderSelectedFile(file) {
  if (!file) {
    fileMetaEl.classList.add('hidden');
    fileMetaEl.innerHTML = '';
    setStatus(t('status.no_file'));
    return;
  }
  fileMetaEl.classList.remove('hidden');
  fileMetaEl.innerHTML = `
    <div>
      <strong>${escapeHtml(file.name)}</strong>
      <span>${escapeHtml(file.type || 'unknown')}</span>
    </div>
    <span>${escapeHtml(formatBytes(file.size))}</span>
  `;
  setStatus(t('status.selected') + file.name);
}

function renderReport(report) {
  reportEl._lastReport = report;
  emptyStateEl.classList.add('hidden');
  reportEl.classList.remove('hidden');

  const signals = report.signals || [];
  const signalCards = signals.length
    ? signals.map(renderSignalCard).join('')
    : `<div class="empty-state success-state">${escapeHtml(t('report.no_signals'))}</div>`;

  const limitations = (report.limitations || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('') || `<li>${escapeHtml(t('report.no_limitations'))}</li>`;

  reportEl.innerHTML = `
    <div class="report-header">
      <span class="badge ${escapeHtml(report.overall_confidence || 'none')}">${escapeHtml(labelForConfidence(report.overall_confidence))}</span>
      <strong>${escapeHtml(report.ai_generated ? t('report.ai_yes') : t('report.ai_no'))}</strong>
    </div>
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
  analyzeBtn.disabled = !wasmApi || !selectedFile || isAnalyzing;
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

const fileInput = document.querySelector('#file-input');
const analyzeBtn = document.querySelector('#analyze-btn');
const statusEl = document.querySelector('#status');
const reportEl = document.querySelector('#report');
const emptyStateEl = document.querySelector('#empty-state');
const platformListEl = document.querySelector('#platform-list');
const formatListEl = document.querySelector('#format-list');
const signalTypesEl = document.querySelector('#signal-types');

let wasmApi = null;
let selectedFile = null;

boot();

async function boot() {
  try {
    const pkg = await import('./pkg/aicheck.js');
    if (typeof pkg.default === 'function') {
      await pkg.default();
    }
    pkg.initPanicHook?.();
    wasmApi = pkg;

    const capabilities = await wasmApi.supportedImageCapabilities();
    renderCapabilities(capabilities);
    setStatus('WASM 已就绪，可以开始检测。');
    analyzeBtn.disabled = false;
  } catch (error) {
    console.error(error);
    setStatus('WASM 包尚未构建。先运行 wasm-pack build --target web --out-dir web/pkg。', true);
  }
}

fileInput.addEventListener('change', (event) => {
  selectedFile = event.target.files?.[0] || null;
  if (selectedFile) {
    setStatus(`已选择：${selectedFile.name}`);
  } else {
    setStatus('还没有选择文件。');
  }
});

analyzeBtn.addEventListener('click', async () => {
  if (!wasmApi) {
    setStatus('WASM 还没加载成功。', true);
    return;
  }
  if (!selectedFile) {
    setStatus('先选一张图片。', true);
    return;
  }

  try {
    analyzeBtn.disabled = true;
    setStatus('正在本地分析图片…');
    const bytes = new Uint8Array(await selectedFile.arrayBuffer());
    const report = await wasmApi.analyzeImage(bytes, selectedFile.name);
    renderReport(report);
    setStatus('分析完成。');
  } catch (error) {
    console.error(error);
    setStatus(error?.message || String(error), true);
  } finally {
    analyzeBtn.disabled = false;
  }
});

function renderCapabilities(capabilities) {
  renderTags(platformListEl, capabilities.supported_platforms || []);
  renderTags(formatListEl, capabilities.supported_formats || []);
  renderBullets(signalTypesEl, capabilities.supported_signal_types || []);
}

function renderReport(report) {
  emptyStateEl.classList.add('hidden');
  reportEl.classList.remove('hidden');

  const signalCards = (report.signals || []).length
    ? report.signals.map(renderSignalCard).join('')
    : '<div class="empty-state">没检测到已知 AI 来源信号。注意：这不等于图片一定不是 AI 生成。</div>';

  const limitations = (report.limitations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  reportEl.innerHTML = `
    <div class="report-header">
      <span class="badge ${escapeHtml(report.overall_confidence || 'none')}">${escapeHtml(labelForConfidence(report.overall_confidence))}</span>
      <strong>${report.ai_generated ? '检测到 AI 来源信号' : '未检测到已知 AI 来源信号'}</strong>
    </div>

    <div class="summary-grid">
      <div class="summary-item">
        <div class="label">文件名</div>
        <div class="value">${escapeHtml(report.file_name || '未提供')}</div>
      </div>
      <div class="summary-item">
        <div class="label">MIME 类型</div>
        <div class="value">${escapeHtml(report.mime_type || 'unknown')}</div>
      </div>
      <div class="summary-item">
        <div class="label">模式</div>
        <div class="value">${escapeHtml(report.mode || 'browser-image-alpha')}</div>
      </div>
      <div class="summary-item">
        <div class="label">信号数量</div>
        <div class="value">${(report.signals || []).length}</div>
      </div>
    </div>

    <h3>命中的信号</h3>
    <div class="signal-list">${signalCards}</div>

    <h3>限制与风险提示</h3>
    <ul class="limitation-list">${limitations}</ul>
  `;
}

function renderSignalCard(signal) {
  const detailItems = (signal.details || [])
    .map((detail) => `<li><strong>${escapeHtml(detail.key)}：</strong>${escapeHtml(detail.value)}</li>`)
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
  container.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderBullets(container, items) {
  container.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function labelForConfidence(confidence) {
  switch ((confidence || '').toLowerCase()) {
    case 'high':
      return 'HIGH';
    case 'medium':
      return 'MEDIUM';
    case 'low':
      return 'LOW';
    default:
      return 'NONE';
  }
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('muted', !isError);
  statusEl.style.color = isError ? '#ffb3b3' : '';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

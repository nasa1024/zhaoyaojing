// ─── History module ───────────────────────────────────────────────
// Shared helpers needed by history (duplicated here to avoid a
// separate util file; detect.js keeps its own copies for the render
// functions that also need them).

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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

// ─── History storage ──────────────────────────────────────────────
const HISTORY_KEY = 'aicheck_history';
const HISTORY_MAX = 10;

export function saveHistory(results) {
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

export function loadHistoryRaw() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

// renderHistory needs t, emptyStateEl, reportEl, renderSingleReport from the
// caller context — accept them as parameters so history.js stays side-effect free.
export function renderHistory({ historyListEl, emptyStateEl, reportEl, t, renderSingleReport }) {
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

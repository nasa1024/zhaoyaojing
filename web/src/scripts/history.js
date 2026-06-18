// ─── History module ───────────────────────────────────────────────
import { escapeHtml, labelForConfidence, timeAgo } from './format.js';

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

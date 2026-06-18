// ─── Shared formatting helpers ────────────────────────────────────
// Single source of truth for small string/format utilities used by
// both detect.js and history.js. (render.js lives in /public and keeps
// its own copy because it is served as a separate module graph.)

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function labelForConfidence(confidence) {
  switch ((confidence || '').toLowerCase()) {
    case 'high':   return 'HIGH';
    case 'medium': return 'MEDIUM';
    case 'low':    return 'LOW';
    default:       return 'NONE';
  }
}

export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

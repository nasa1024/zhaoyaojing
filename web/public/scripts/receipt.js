import { deriveEvidenceState } from './state.js';

// Revoke object URLs a while after the download click so slow disks/browsers
// have time to start the download before the blob is freed.
const OBJECT_URL_TTL_MS = 30_000;

function ga(name, params) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const CONCLUSION = {
  A: 'The file contains verifiable AI-origin provenance signals.',
  B: 'The file contains AI-related metadata that is not cryptographically signed.',
  C: 'No recognizable origin signals were found. This is not proof of human creation.',
  D: 'A provenance claim exists but could not be verified, or fields conflict.',
};
const DISCLAIMER = 'This is a provenance reading, not a legal authenticity verdict.';

export function buildReceiptModel(report) {
  const d = deriveEvidenceState(report);
  const prov = report.provenance || {};
  const m = prov.manifest || {};
  const lines = [
    { label: 'File', value: report.file_name || '—' },
    { label: 'Processing', value: 'Local browser only' },
    { label: 'Evidence State', value: d.state },
    { label: 'Signature', value: prov.state || 'unsigned' },
    { label: 'Claim Generator', value: m.claim_generator || '—' },
    { label: 'AI Source Type', value: m.digital_source_type || '—' },
    { label: 'Signals', value: String((report.signals || []).length) },
  ];
  return {
    file: report.file_name || '—',
    checked: new Date().toISOString().slice(0, 10),
    processing: 'Local browser only',
    state: d.state,
    lines,
    conclusion: CONCLUSION[d.state],
    disclaimer: DISCLAIMER,
  };
}

export function receiptToText(model) {
  const body = model.lines.map((l) => `${l.label}: ${l.value}`).join('\n');
  return `AICheck365 — SIGNAL RECEIPT\n\n${body}\n\nConclusion:\n${model.conclusion}\n\nDisclaimer:\n${model.disclaimer}\n\naicheck365.com`;
}

export function receiptToJSON(model) {
  return JSON.stringify({ tool: 'AICheck365', ...model }, null, 2);
}

export function receiptToCitation(model) {
  return `AICheck365 provenance reading of "${model.file}" (${model.checked}): state ${model.state}. ${model.disclaimer} — aicheck365.com`;
}

export async function receiptToPngBlob(model) {
  const W = 720, pad = 32, lh = 30;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = pad * 2 + lh * (model.lines.length + 6);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#151515';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#C8FF3D';
  ctx.font = '700 22px monospace';
  ctx.fillText('AICheck365 — SIGNAL RECEIPT', pad, pad + 20);
  ctx.fillStyle = '#ECE7DC';
  ctx.font = '15px monospace';
  let y = pad + 20 + lh;
  for (const l of model.lines) {
    ctx.fillText(`${l.label}: ${l.value}`, pad, y);
    y += lh;
  }
  y += lh * 0.5;
  ctx.fillStyle = '#8B86A8';
  ctx.fillText(model.disclaimer, pad, y);
  return await new Promise((res) => canvas.toBlob(res, 'image/png'));
}

function download(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_TTL_MS);
}

export function mountReceipt(container, report, translate) {
  if (!container) return;
  // translate(key, fallback) is injected by render.js (the client i18n translator).
  // Falls back to the Chinese default copy when not provided.
  const tr = typeof translate === 'function' ? translate : (_k, fb) => fb;
  const model = buildReceiptModel(report);
  const wrap = document.createElement('div');
  wrap.className = 'receipt-actions';
  const buttons = [
    ['text', 'receipt.btn.text', '复制文字摘要'],
    ['cite', 'receipt.btn.cite', '复制引用格式'],
    ['json', 'receipt.btn.json', '下载 JSON'],
    ['png', 'receipt.btn.png', '下载 PNG'],
    ['print', 'receipt.btn.print', '打印 / PDF'],
  ];
  wrap.innerHTML = buttons
    .map(([act, key, fb]) => `<button data-act="${act}">${tr(key, fb)}</button>`)
    .join('');
  wrap.addEventListener('click', async (e) => {
    const act = e.target?.dataset?.act;
    if (!act) return;
    if (act === 'text') {
      copyToClipboard(receiptToText(model)); // fire-and-forget; errors handled internally
      ga('report_exported', { format: 'text' });
    } else if (act === 'cite') {
      copyToClipboard(receiptToCitation(model));
      ga('report_exported', { format: 'citation' });
    } else if (act === 'json') {
      download('aicheck365-receipt.json', new Blob([receiptToJSON(model)], { type: 'application/json' }));
      ga('report_exported', { format: 'json' });
    } else if (act === 'png') {
      download('aicheck365-receipt.png', await receiptToPngBlob(model));
      ga('report_exported', { format: 'png' });
    } else if (act === 'print') {
      window.print();
      ga('report_exported', { format: 'print' });
    }
  });
  container.innerHTML = '';
  container.appendChild(wrap);
}

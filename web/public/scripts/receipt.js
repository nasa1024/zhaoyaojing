import { deriveEvidenceState } from './state.js';

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
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function mountReceipt(container, report) {
  if (!container) return;
  const model = buildReceiptModel(report);
  const wrap = document.createElement('div');
  wrap.className = 'receipt-actions';
  wrap.innerHTML = `
    <button data-act="text">复制文字摘要</button>
    <button data-act="cite">复制引用格式</button>
    <button data-act="json">下载 JSON</button>
    <button data-act="png">下载 PNG</button>
    <button data-act="print">打印 / PDF</button>`;
  wrap.addEventListener('click', async (e) => {
    const act = e.target?.dataset?.act;
    if (!act) return;
    if (act === 'text') navigator.clipboard.writeText(receiptToText(model));
    else if (act === 'cite') navigator.clipboard.writeText(receiptToCitation(model));
    else if (act === 'json') download('aicheck365-receipt.json', new Blob([receiptToJSON(model)], { type: 'application/json' }));
    else if (act === 'png') download('aicheck365-receipt.png', await receiptToPngBlob(model));
    else if (act === 'print') window.print();
  });
  container.innerHTML = '';
  container.appendChild(wrap);
}

export const EVIDENCE_STATE = { A: 'A', B: 'B', C: 'C', D: 'D' };

const AI_SOURCE_HINTS = ['trainedalgorithmicmedia','compositewithtrainedalgorithmicmedia',
  'compositesynthetic','algorithmicmedia','datadrivenmedia','trainedalgorithmicdata'];
const CAMERA_HINTS = ['make','model','相机','camera','lens','镜头'];

function manifestPointsToAi(m) {
  if (!m) return false;
  const dst = (m.digital_source_type || '').toLowerCase();
  if (AI_SOURCE_HINTS.some((h) => dst.includes(h))) return true;
  return Boolean(m.claim_generator); // 有签名 + 有生成器，结合 AI 信号视为来源声明
}

function aiSignals(report) {
  return (report.signals || []).filter((s) => (s.confidence || 'none') !== 'none');
}

export function hasFieldConflict(report) {
  if (report.provenance && report.provenance.state === 'invalid') return true;
  const signals = report.signals || [];
  const cameraLike = signals.some((s) =>
    CAMERA_HINTS.some((h) => (s.description || '').toLowerCase().includes(h)) && !s.tool);
  const aiTool = signals.some((s) => Boolean(s.tool));
  return cameraLike && aiTool;
}

export function deriveEvidenceState(report) {
  const prov = report.provenance || { state: 'unsigned', manifest: null };
  const ai = aiSignals(report);
  const conflicts = [];
  let state, signature = null, level;

  if (prov.state === 'invalid') {
    state = EVIDENCE_STATE.D;
    conflicts.push('signature-invalid');
    level = 'fail';
  } else if (hasFieldConflict(report)) {
    state = EVIDENCE_STATE.D;
    conflicts.push('field-conflict');
    level = 'fail';
  } else if ((prov.state === 'trusted' || prov.state === 'valid') && manifestPointsToAi(prov.manifest)) {
    state = EVIDENCE_STATE.A;
    signature = prov.state; // 'trusted' | 'valid'
    level = 'verified';
  } else if (ai.length > 0) {
    state = EVIDENCE_STATE.B;
    level = 'weak';
  } else {
    state = EVIDENCE_STATE.C;
    level = 'unknown';
  }

  return {
    state, level, signature, conflicts,
    aiSignals: ai,
    hasProvenanceAi: manifestPointsToAi(prov.manifest),
  };
}

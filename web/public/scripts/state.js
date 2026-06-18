export const EVIDENCE_STATE = { A: 'A', B: 'B', C: 'C', D: 'D' };

const AI_SOURCE_HINTS = ['trainedalgorithmicmedia','compositewithtrainedalgorithmicmedia',
  'compositesynthetic','algorithmicmedia','datadrivenmedia','trainedalgorithmicdata'];
const CAMERA_HINTS = ['make','model','相机','camera','lens','镜头'];
const AI_TOOL_HINTS = ['openai','dall-e','dall·e','dalle','gpt image','imagen','gemini','google ai',
  'midjourney','stable diffusion','stability','firefly','flux','ideogram','leonardo','novelai',
  'sora','kling','runway','pika','veo','comfyui','grok','seedream','recraft','qwen','jimeng'];

function manifestPointsToAi(m) {
  if (!m) return false;
  const dst = (m.digital_source_type || '').toLowerCase();
  if (AI_SOURCE_HINTS.some((h) => dst.includes(h))) return true;
  if (m.claim_generator && typeof m.claim_generator === 'string') {
    const cg = m.claim_generator.toLowerCase();
    if (AI_TOOL_HINTS.some((h) => cg.includes(h))) return true;
  }
  return false;
}

function aiSignals(report) {
  return (report.signals || []).filter((s) => (s.confidence || 'none') !== 'none');
}

export function hasFieldConflict(report) {
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

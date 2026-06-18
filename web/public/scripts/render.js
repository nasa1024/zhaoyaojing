import { deriveEvidenceState } from './state.js';

function ga(name, params) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

const SIG_CLASS = { verified: 'sig-verified', neutral: 'sig-neutral', weak: 'sig-weak', fail: 'sig-fail', unknown: 'sig-unknown' };
const LEVEL_CLASS = { verified: 'sig-verified', weak: 'sig-weak', unknown: 'sig-unknown', fail: 'sig-fail' };

// Evidence-level human labels keyed by derived state level
const LEVEL_LABEL = {
  verified: { key: 'result.level.a', fallback: '已验证来源（数字签名）' },
  weak:     { key: 'result.level.b', fallback: '弱信号（未签名元数据）' },
  unknown:  { key: 'result.level.c', fallback: '未发现可识别信号' },
  fail:     { key: 'result.level.d', fallback: '验证失败 / 字段冲突' },
};

// Keywords that qualify a signal as an editing/creation-software clue (not AI tool)
const EDIT_KEYWORDS = ['software', '软件', '编辑', '导出', 'premiere', 'photoshop', 'ffmpeg', 'lightroom', 'capcut', '剪映'];
const COMPRESS_KEYWORDS = ['压缩', '截图', '转码', '导出', '转发', 'compress', 'screenshot', 'transcod'];

function esc(v) {
  return String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Translator is injected by detect.js after i18n loads (setTranslator(t)).
// Falls back to built-in Chinese copy when not injected — production must inject.
let _t = null;
export function setTranslator(fn) { _t = fn; }
function tt(key, fallback) {
  try {
    const v = _t ? _t(key) : null;
    return (v && v !== key) ? v : fallback;
  } catch {
    return fallback;
  }
}

const STATE_COPY = {
  A: { key: 'result.state.a', fallback: '发现可验证的来源凭证', level: 'verified' },
  B: { key: 'result.state.b', fallback: '发现 AI 相关元数据', level: 'weak' },
  C: { key: 'result.state.c', fallback: '未发现可识别的来源信号', level: 'unknown' },
  D: { key: 'result.state.d', fallback: '来源声明无法完成验证', level: 'fail' },
};
const STATE_DISCLAIMER = {
  C: {
    key: 'result.state.c.note',
    fallback: '这不能证明文件由人类创作。来源信息可能从未写入，也可能在截图、压缩、转码或重新导出时被删除。',
  },
  D: {
    key: 'result.state.d.note',
    fallback: '文件包含来源信息，但签名失效或字段之间存在冲突，不能给出确定性来源结论。',
  },
};

export function renderResult(container, report, { expert = false } = {}) {
  const d = deriveEvidenceState(report);
  if (expert) ga('expert_mode_enabled', {});
  const sc = STATE_COPY[d.state];
  const sections = [];

  // 1. Conclusion summary (state badge + semantic color)
  const stateLabel = tt(sc.key, sc.fallback);
  // Surface the AI-detected / no-signals headline that regression tests rely on
  const hasSignals = (report.signals || []).length > 0;
  const headlineText = hasSignals
    ? tt('report.ai_yes', '检测到 AI 来源信号')
    : tt('report.ai_no', '未检测到 AI 来源信号');
  sections.push(`<div class="evidence-summary">
    <span class="sig ${LEVEL_CLASS[sc.level]}">${esc(stateLabel)}</span>
    <strong class="case-file-name">${esc(report.file_name || '—')}</strong>
    <span class="ai-verdict">${esc(headlineText)}</span>
  </div>`);

  // 2. Evidence note for states C and D
  if (STATE_DISCLAIMER[d.state]) {
    sections.push(`<p class="evidence-note">${esc(tt(STATE_DISCLAIMER[d.state].key, STATE_DISCLAIMER[d.state].fallback))}</p>`);
  }

  // 2b. Standalone "证据等级" (Evidence Level) block — Fix 1
  const ll = LEVEL_LABEL[sc.level];
  const levelLabel = tt(ll.key, ll.fallback);
  sections.push(`<div class="evidence-level-section">
    <h4>${esc(tt('result.level', '证据等级'))}</h4>
    <div class="evidence-level"><span class="sig ${LEVEL_CLASS[sc.level]}">${esc(levelLabel)}</span> <span>${esc(levelLabel)}</span></div>
  </div>`);

  // Summary grid: mime_type, mode etc. (for regression: video/mp4 must appear)
  sections.push(`<div class="summary-grid">
    <div class="summary-item">
      <div class="label">${esc(tt('report.label.filename', '文件名'))}</div>
      <div class="value">${esc(report.file_name || '—')}</div>
    </div>
    <div class="summary-item">
      <div class="label">${esc(tt('report.label.mime', '文件类型'))}</div>
      <div class="value">${esc(report.mime_type || 'unknown')}</div>
    </div>
    <div class="summary-item">
      <div class="label">${esc(tt('report.label.media_type', 'Media'))}</div>
      <div class="value">${esc(report.media_type || 'image')}</div>
    </div>
    <div class="summary-item">
      <div class="label">${esc(tt('report.label.mode', '模式'))}</div>
      <div class="value">${esc(report.mode || 'browser-image')}</div>
    </div>
    <div class="summary-item">
      <div class="label">${esc(tt('report.label.signals', '信号数'))}</div>
      <div class="value">${(report.signals || []).length}</div>
    </div>
  </div>`);

  // 3. Found signals (Evidence Cards)
  const found = report.signals || [];
  sections.push(
    `<h3>${esc(tt('result.found', '发现的信号'))}</h3>` +
    (found.length
      ? `<div class="signal-list">${found.map(renderEvidenceCard).join('')}</div>`
      : `<p class="muted">${esc(tt('result.none', '无'))}</p>`)
  );

  // 4. Not-found signals
  sections.push(`<h3>${esc(tt('result.notfound', '未发现的信号'))}</h3>${renderNotFound(report)}`);

  // 5. Propagation / edit clues — Fix 2
  sections.push(renderClues(report));

  // 6. Raw fields / expert mode
  if (expert) sections.push(renderExpert(report));

  // 7. Limitations
  const lims = report.limitations || [];
  sections.push(
    `<h3>${esc(tt('result.limits', '限制说明'))}</h3><ul class="limitation-list">${
      lims.map((l) => `<li>${esc(l)}</li>`).join('') ||
      `<li>${esc(tt('result.none', '无'))}</li>`
    }</ul>`
  );

  // 8. Next-steps decision tree
  sections.push(`<h3>${esc(tt('result.next', '下一步建议'))}</h3>${renderNextSteps(d.state)}`);

  // 9/10. Related platforms / articles row
  sections.push(`<div class="related-row" id="related-links"></div>`);

  // 11. Receipt export mount point (Task E will wire this)
  sections.push(`<div id="receipt-mount"></div>`);

  ga('result_status_viewed', { state: d.state });
  container.innerHTML = sections.join('\n');
  import('./receipt.js').then(m => m.mountReceipt(container.querySelector('#receipt-mount'), report, tt)).catch(() => {});
}

// Confidence-level → CSS class. Never maps to sig-verified (green is reserved for signature).
// high→sig-neutral (teal/blue), medium→sig-weak (yellow), low/other→sig-unknown (grey).
const CONF_CLASS = { high: 'sig-neutral', medium: 'sig-weak', low: 'sig-unknown' };

// Fix 3: per-card badge always sig-neutral; confidence chip uses CONF_CLASS
function renderEvidenceCard(s) {
  const confKey = (s.confidence || 'low').toLowerCase();
  const confClass = CONF_CLASS[confKey] || SIG_CLASS.unknown;
  const details = (s.details || [])
    .map((x) => `<li><span class="mono">${esc(x.key)}</span>: <span class="mono">${esc(x.value)}</span></li>`)
    .join('');
  return `<article class="evidence-card">
    <div class="evidence-card-head">
      <span class="signal-source mono sig sig-neutral">${esc(s.source || '')}</span>
      <span class="sig ${confClass}">${esc((s.confidence || 'low').toUpperCase())}</span>
      ${s.tool ? `<span class="tag-inline">${esc(s.tool)}</span>` : ''}
    </div>
    <div>${esc(s.description || '')}</div>
    ${details ? `<ul class="detail-list">${details}</ul>` : ''}
  </article>`;
}

function renderNotFound(report) {
  const layers = [
    ['C2PA', tt('layer.c2pa', 'C2PA 数字签名')],
    ['XMP', 'XMP'],
    ['EXIF', 'EXIF'],
    ['PNG', tt('layer.png', 'PNG 生成参数')],
    ['MP4', tt('layer.mp4', '视频容器/SEI')],
  ];
  const present = new Set((report.signals || []).map((s) => s.source));
  const items = layers
    .filter(([k]) => !present.has(k))
    .map(([, label]) => `<li><span class="sig sig-unknown">—</span> ${esc(label)}</li>`)
    .join('');
  return `<ul class="notfound-list">${items || `<li class="muted">${esc(tt('result.allfound', '所有层都发现了信号'))}</li>`}</ul>`;
}

// Fix 2: Propagation / edit clues section
function renderClues(report) {
  const heading = esc(tt('result.clues', '传播与编辑线索'));

  // Collect editing-software signals: no tool AND description contains edit keyword
  const editClues = (report.signals || [])
    .filter((s) => !s.tool && EDIT_KEYWORDS.some((kw) => (s.description || '').toLowerCase().includes(kw)))
    .map((s) => s.description);

  // Collect limitations that mention compression/screenshot/transcode
  const limClues = (report.limitations || [])
    .filter((l) => COMPRESS_KEYWORDS.some((kw) => l.toLowerCase().includes(kw)));

  const allClues = [...editClues, ...limClues];

  if (allClues.length > 0) {
    return `<h3>${heading}</h3><ul class="clues-list">${allClues.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`;
  }
  return `<h3>${heading}</h3><p class="clues-none">${esc(tt('result.clues.none', '未发现明显的编辑或传播线索（这既不能证明也不能否定文件被处理过）。'))}</p>`;
}

// Fix 4: stable ASCII i18n keys using index, Chinese text as fallback
function renderNextSteps(state) {
  const stepsCD = [
    '确认是否为原始文件',
    '尝试获取最早发布版本',
    '检查是否为截图',
    '检查是否经过聊天软件压缩',
    '谨慎参考视觉异常，不要单独依赖',
    '查看对应平台的已知标记',
    '对比其他来源文件',
  ];
  const stepsAB = [
    '查看该字段的含义',
    '查看平台指纹档案',
    '比较其他平台的来源声明',
    '查看相同平台真实样本',
    '导出检测报告',
  ];
  const isCD = state === 'C' || state === 'D';
  const list = isCD ? stepsCD : stepsAB;
  const prefix = isCD ? 'next.c.' : 'next.ab.';
  return `<ol class="next-steps">${list.map((x, i) => `<li>${esc(tt(prefix + i, x))}</li>`).join('')}</ol>`;
}

function renderExpert(report) {
  const prov = report.provenance || {};
  return `<details class="expert-block" open><summary>${esc(tt('result.expert', '专家模式'))}</summary>
    <div class="kv mono">provenance.state: ${esc(prov.state || 'unsigned')}</div>
    ${(prov.validation_status || []).map((v) => `<div class="kv mono">${esc(v.code || '')}</div>`).join('')}
    ${prov.raw_json ? `<pre class="mono raw-json">raw_json:\n${esc(prov.raw_json)}</pre>` : ''}
  </details>`;
}

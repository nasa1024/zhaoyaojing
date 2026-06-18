import { FFmpeg } from '@ffmpeg/ffmpeg';
import { saveHistory, loadHistoryRaw, renderHistory } from './history.js';

const i18nModuleUrl = '/scripts/i18n.js';
const { t, applyI18n, setLang } = await import(/* @vite-ignore */ i18nModuleUrl);
const renderModuleUrl = '/scripts/render.js';
const { renderResult, setTranslator } = await import(/* @vite-ignore */ renderModuleUrl);
setTranslator(t);
const wasmModuleUrl = '/pkg/aicheck.js';
const ffmpegCoreBaseUrl = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
const ffmpegCoreFiles = {
  coreURL: `${ffmpegCoreBaseUrl}/ffmpeg-core.js`,
  wasmURL: `${ffmpegCoreBaseUrl}/ffmpeg-core.wasm`,
};

export function initDetector() {
  // ─── DOM refs ────────────────────────────────────────────────────
  const fileInput      = document.querySelector('#file-input');
  const analyzeBtn     = document.querySelector('#analyze-btn');
  const statusEl       = document.querySelector('#status');
  const reportEl       = document.querySelector('#report');
  const emptyStateEl   = document.querySelector('#empty-state');
  const fileMetaEl     = document.querySelector('#file-meta');
  const uploadZoneEl   = document.querySelector('#upload-zone');
  const langBtn        = document.querySelector('#lang-switch');
  const historyListEl  = document.querySelector('#history-list');
  const themeBtn       = document.getElementById('theme-toggle');
  const hamburger      = document.getElementById('hamburger');
  const mobileMenu     = document.getElementById('mobile-menu');
  const expertModeEl   = document.getElementById('expert-mode');

  let wasmApi       = null;
  let wasmReadyPromise = null;
  let selectedFiles = [];
  let isAnalyzing   = false;
  let ffmpegLoader  = null;
  let ffmpegCoreAssetUrls = null;
  let lastSingleReport = null;

  // ─── Lazy wasm loader ────────────────────────────────────────────
  async function ensureWasm() {
    if (!wasmReadyPromise) {
      wasmReadyPromise = (async () => {
        const pkg = await import(/* @vite-ignore */ wasmModuleUrl);
        if (typeof pkg.default === 'function') await pkg.default();
        pkg.initPanicHook?.();
        wasmApi = pkg;
        return pkg;
      })();
    }
    return wasmReadyPromise;
  }

  // ─── Init ────────────────────────────────────────────────────────
  applyI18n();
  applyTheme(localStorage.getItem('theme') ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  renderHistory({ historyListEl, emptyStateEl, reportEl, t, renderSingleReport });
  setStatus(t('status.ready'));
  syncAnalyzeButton();

  langBtn?.addEventListener('change', (e) => setLang(e.target.value));

  expertModeEl?.addEventListener('change', () => {
    if (lastSingleReport && !reportEl.classList.contains('hidden')) {
      renderResult(reportEl, lastSingleReport, { expert: expertModeEl.checked });
    }
  });

  document.addEventListener('langchange', () => {
    syncAnalyzeButton();
    if (selectedFiles.length) renderSelectedFiles(selectedFiles);
    if (!reportEl.classList.contains('hidden') && reportEl._lastReports) {
      renderReports(reportEl._lastReports);
    } else if (lastSingleReport && !reportEl.classList.contains('hidden')) {
      renderResult(reportEl, lastSingleReport, { expert: expertModeEl?.checked ?? false });
    }
  });

  // ─── GA4 helper ──────────────────────────────────────────────────
  function ga(name, params = {}) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  }

  // ─── Evidence state derivation (mirrors state.js — no import needed) ───────
  function deriveStateFromReport(report) {
    const prov = report?.provenance || { state: 'unsigned', manifest: null };
    const signals = report?.signals || [];
    const ai = signals.filter((s) => (s.confidence || 'none') !== 'none');
    // field conflict: camera-like signal + AI-tool signal present together
    const cameraHints = ['make','model','相机','camera','lens','镜头'];
    const cameraLike = signals.some((s) => cameraHints.some((h) => (s.description || '').toLowerCase().includes(h)) && !s.tool);
    const hasTool = signals.some((s) => Boolean(s.tool));
    const conflict = cameraLike && hasTool;
    if (prov.state === 'invalid' || conflict) return 'D';
    const aiSourceHints = ['trainedalgorithmicmedia','compositewithtrainedalgorithmicmedia','compositesynthetic','algorithmicmedia','datadrivenmedia'];
    const aiToolHints = ['openai','dall-e','dalle','gpt image','imagen','gemini','midjourney','stable diffusion','stability','firefly','flux','ideogram','leonardo','sora','kling','runway','pika','veo','comfyui','grok','seedream','recraft','qwen','jimeng'];
    const m = prov.manifest || {};
    const dst = (m.digital_source_type || '').toLowerCase();
    const cg = (m.claim_generator || '').toLowerCase();
    const manifestAi = aiSourceHints.some((h) => dst.includes(h)) || aiToolHints.some((h) => cg.includes(h));
    if ((prov.state === 'trusted' || prov.state === 'valid') && manifestAi) return 'A';
    if (ai.length > 0) return 'B';
    return 'C';
  }

  // ─── File selection ──────────────────────────────────────────────
  fileInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files || []);
    selectedFiles = files.filter(isSupportedMedia);
    if (selectedFiles.length) {
      ga('file_select', { file_count: selectedFiles.length, file_type: selectedFiles[0].type || mediaTypeFromName(selectedFiles[0].name) });
    }
    renderSelectedFiles(selectedFiles);
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
    const files = Array.from(event.dataTransfer?.files || []);
    const valid = files.filter(isSupportedMedia);
    if (!valid.length) { setStatus(t('status.unsupported'), true); return; }
    selectedFiles = valid;
    fileInput.value = '';
    renderSelectedFiles(valid);
    syncAnalyzeButton();
  });

  // ─── Analyze ─────────────────────────────────────────────────────
  analyzeBtn.addEventListener('click', async () => {
    if (!selectedFiles.length) { setStatus(t('status.no_file'), true); return; }

    try {
      isAnalyzing = true;
      syncAnalyzeButton();
      setStatus(t('status.loading_engine') || '正在加载检测引擎…');
      await ensureWasm();
      setStatus(t('status.analyzing'));
      ga('analysis_started', { file_count: selectedFiles.length });

      const results = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setStatus(`${t('status.analyzing')} (${i + 1}/${selectedFiles.length})`);
        const bytes = new Uint8Array(await file.arrayBuffer());
        const report = await analyzeFile(file, bytes);
        results.push({ file, report });
      }

      // Derive evidence state from the first result for the completion event
      const firstReport = results[0]?.report;
      const evidenceState = firstReport ? deriveStateFromReport(firstReport) : 'C';
      const signalCount = (firstReport?.signals || []).length;
      const mediaType = firstReport?.media_type || (firstReport?.mime_type?.startsWith('video/') ? 'video' : 'image');
      ga('analysis_completed', {
        evidence_state: evidenceState,
        signal_count: signalCount,
        media_type: mediaType,
        file_count: results.length,
      });

      renderReports(results);
      saveHistory(results);
      renderHistory({ historyListEl, emptyStateEl, reportEl, t, renderSingleReport });
      setStatus(t('status.done'));
    } catch (error) {
      console.error(error);
      setStatus(error?.message || String(error), true);
      ga('analysis_failed', { error_type: error?.constructor?.name || 'UnknownError' });
    } finally {
      isAnalyzing = false;
      syncAnalyzeButton();
    }
  });

  async function analyzeFile(file, bytes) {
    const report = wasmApi.analyzeMedia
      ? await wasmApi.analyzeMedia(bytes, file.name)
      : await wasmApi.analyzeImage(bytes, file.name);

    if (!shouldAnalyzeVideoFrames(file, report)) {
      return report;
    }

    try {
      const frameReports = await analyzeVideoFrames(file, bytes);
      return mergeFrameReports(report, frameReports);
    } catch (error) {
      console.warn('Video frame analysis failed', error);
      return withLimitation(report, `${t('video.frame_failed') || 'Video frame analysis was not completed'}: ${error?.message || String(error)}`);
    }
  }

  function shouldAnalyzeVideoFrames(file, report) {
    return isSupportedVideo(file)
      && wasmApi?.analyzeVideoFrameRgba
      && !(report.signals || []).length;
  }

  async function analyzeVideoFrames(file, bytes) {
    const frames = await extractVideoFrames(file, bytes);
    const reports = [];
    for (const frame of frames) {
      if (!frame?.rgba || !frame.width || !frame.height) continue;
      reports.push(await wasmApi.analyzeVideoFrameRgba(
        frame.rgba,
        Number(frame.width),
        Number(frame.height),
        Number(frame.timestamp ?? frame.timestamp_seconds ?? 0),
      ));
    }
    return reports;
  }

  async function extractVideoFrames(file, bytes) {
    if (typeof window.__AICHECK_TEST_FRAME_EXTRACTOR__ === 'function') {
      return await window.__AICHECK_TEST_FRAME_EXTRACTOR__(file, bytes);
    }

    const ffmpeg = await getFfmpeg();
    const inputName = `input-${Date.now()}-${safeFfmpegName(file.name)}`;
    const outputWidth = 320;
    const outputHeight = 180;
    const duration = await getVideoDuration(file);
    const timestamps = Number.isFinite(duration) && duration > 0
      ? [duration * 0.25, duration * 0.5, duration * 0.75]
      : [1, 2, 3];
    const frames = [];

    await ffmpeg.writeFile(inputName, bytes);
    try {
      for (const timestampSeconds of timestamps) {
        const timestamp = Math.max(0, Math.round(timestampSeconds * 10) / 10);
        const outputName = `frame-${String(timestamp).replace('.', '-')}-${Date.now()}.rgba`;
        const args = [
          '-ss', String(timestamp),
          '-i', inputName,
          '-frames:v', '1',
          '-vf', `scale=${outputWidth}:${outputHeight},format=rgba`,
          '-f', 'rawvideo',
          outputName,
        ];
        const code = await ffmpeg.exec(args);
        if (code !== 0) continue;
        const data = await ffmpeg.readFile(outputName);
        if (data?.length === outputWidth * outputHeight * 4) {
          frames.push({ rgba: data, width: outputWidth, height: outputHeight, timestamp });
        }
        try { await ffmpeg.deleteFile(outputName); } catch {}
      }
    } finally {
      try { await ffmpeg.deleteFile(inputName); } catch {}
    }

    if (!frames.length) {
      throw new Error(t('video.no_frames') || 'No decodable video frames were extracted');
    }
    return frames;
  }

  async function getFfmpeg() {
    if (!ffmpegLoader) {
      ffmpegLoader = (async () => {
        const ffmpeg = new FFmpeg();
        await ffmpeg.load(await getFfmpegCoreAssetUrls());
        return ffmpeg;
      })();
    }
    return ffmpegLoader;
  }

  function getFfmpegCoreAssetUrls() {
    if (!ffmpegCoreAssetUrls) {
      ffmpegCoreAssetUrls = Promise.all([
        toBlobUrl(ffmpegCoreFiles.coreURL, 'text/javascript'),
        toBlobUrl(ffmpegCoreFiles.wasmURL, 'application/wasm'),
      ]).then(([coreURL, wasmURL]) => ({ coreURL, wasmURL }));
    }
    return ffmpegCoreAssetUrls;
  }

  async function toBlobUrl(url, mimeType) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load FFmpeg asset: ${response.status} ${response.statusText}`);
    }
    return URL.createObjectURL(new Blob([await response.arrayBuffer()], { type: mimeType }));
  }

  function getVideoDuration(file) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      let done = false;
      const timer = window.setTimeout(() => cleanup(Number.NaN), 3000);
      const cleanup = (value) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        URL.revokeObjectURL(url);
        video.removeAttribute('src');
        video.load();
        resolve(value);
      };
      video.preload = 'metadata';
      video.muted = true;
      video.onloadedmetadata = () => cleanup(video.duration);
      video.onerror = () => cleanup(Number.NaN);
      video.src = url;
    });
  }

  function mergeFrameReports(baseReport, frameReports) {
    const frameSignals = frameReports.flatMap((report) => report.signals || []);
    if (!frameSignals.length) return baseReport;

    const signals = [...(baseReport.signals || []), ...frameSignals];
    const limitations = [
      ...(baseReport.limitations || []),
      ...frameReports.flatMap((report) => report.limitations || []),
    ];
    return {
      ...baseReport,
      signals,
      limitations: dedupe(limitations),
      ai_generated: true,
      overall_confidence: strongestConfidence(signals),
    };
  }

  function withLimitation(report, limitation) {
    return {
      ...report,
      limitations: dedupe([...(report.limitations || []), limitation]),
    };
  }

  // ─── Render: selected files ──────────────────────────────────────
  function renderSelectedFiles(files) {
    if (!files.length) {
      fileMetaEl.classList.add('hidden');
      fileMetaEl.innerHTML = '';
      setStatus(t('status.no_file'));
      return;
    }
    fileMetaEl.classList.remove('hidden');
    if (files.length === 1) {
      const file = files[0];
      fileMetaEl.innerHTML = `
        <div>
          <strong>${escapeHtml(file.name)}</strong>
          <span>${escapeHtml(file.type || 'unknown')}</span>
        </div>
        <span>${escapeHtml(formatBytes(file.size))}</span>
      `;
    } else {
      const total = files.reduce((s, f) => s + f.size, 0);
      fileMetaEl.innerHTML = `
        <div>
          <strong>${files.length} ${t('upload.files.selected') || 'files selected'}</strong>
          <span>${files.map(f => escapeHtml(f.name)).join(', ')}</span>
        </div>
        <span>${escapeHtml(formatBytes(total))}</span>
      `;
    }
    setStatus((t('status.selected') || 'Selected: ') + files.map(f => f.name).join(', '));
  }

  // ─── Render: multi-file reports ──────────────────────────────────
  function renderReports(results) {
    reportEl._lastReports = results;
    emptyStateEl.classList.add('hidden');
    reportEl.classList.remove('hidden');

    if (results.length === 1) {
      renderSingleReport(results[0].report);
      return;
    }

    // Summary bar for batch
    const aiCount = results.filter(r => r.report.ai_generated).length;
    const expertOn = expertModeEl?.checked ?? false;
    const summaryHtml = `
      <div class="batch-summary">
        <strong>${results.length} ${t('batch.files') || 'files'}</strong> —
        <span class="badge ${aiCount > 0 ? 'high' : 'none'}">${aiCount} ${t('batch.ai_detected') || 'AI signals detected'}</span>
        <button class="share-btn" id="share-btn">${t('share.button') || '📋 Copy Report'}</button>
      </div>
      <div class="batch-results">
        ${results.map((r, i) => `
          <details class="batch-item" ${i === 0 ? 'open' : ''}>
            <summary class="batch-item-header">
              <span class="badge ${r.report.overall_confidence || 'none'}">${escapeHtml(labelForConfidence(r.report.overall_confidence))}</span>
              <span class="batch-item-name">${escapeHtml(r.file.name)}</span>
            </summary>
            <div class="batch-item-body" data-batch-idx="${i}"></div>
          </details>
        `).join('')}
      </div>
    `;
    reportEl.innerHTML = summaryHtml;
    // Render each batch item via renderResult
    results.forEach((r, i) => {
      const bodyEl = reportEl.querySelector(`.batch-item-body[data-batch-idx="${i}"]`);
      if (bodyEl) renderResult(bodyEl, r.report, { expert: expertOn });
    });
    document.getElementById('share-btn')?.addEventListener('click', () => copyReport(results));
  }

  function renderSingleReport(report) {
    lastSingleReport = report;
    const expertOn = expertModeEl?.checked ?? false;
    renderResult(reportEl, report, { expert: expertOn });
  }

  function buildReportHtml(report) {
    const signals = report.signals || [];
    const signalCards = signals.length
      ? signals.map(renderSignalCard).join('')
      : `<div class="empty-state success-state">${escapeHtml(t('report.no_signals'))}</div>`;

    const limitations = (report.limitations || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('') || `<li>${escapeHtml(t('report.no_limitations'))}</li>`;

    return `
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
          <div class="label">${escapeHtml(t('report.label.media_type') || 'Media')}</div>
          <div class="value">${escapeHtml(report.media_type || 'image')}</div>
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

  // ─── Share / copy ────────────────────────────────────────────────
  function copyReport(results) {
    const btn = document.getElementById('share-btn');
    const lines = results.map(({ file, report }) => {
      const signals = (report.signals || []).map(s => `  • [${s.confidence?.toUpperCase()}] ${s.description}`).join('\n');
      return [
        `File: ${report.file_name || file?.name || '—'}`,
        `Result: ${report.ai_generated ? 'AI signals detected' : 'No AI signals found'}`,
        `Confidence: ${(report.overall_confidence || 'none').toUpperCase()}`,
        `Signals: ${(report.signals || []).length}`,
        signals ? `\nSignals:\n${signals}` : '',
        `\nAnalyzed by AICheck365 (aicheck365.com)`,
      ].filter(Boolean).join('\n');
    }).join('\n\n---\n\n');

    navigator.clipboard.writeText(lines).then(() => {
      if (btn) {
        btn.textContent = t('share.copied') || '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = t('share.button') || '📋 Copy Report';
          btn.classList.remove('copied');
        }, 2000);
      }
    }).catch(() => {});
  }

  // ─── Utils ───────────────────────────────────────────────────────
  function syncAnalyzeButton() {
    analyzeBtn.disabled = !selectedFiles.length || isAnalyzing;
    analyzeBtn.textContent = isAnalyzing ? t('btn.running') : t('btn.idle');
  }

  function isSupportedMedia(file) {
    return isSupportedImage(file) || isSupportedVideo(file);
  }

  function isSupportedImage(file) {
    return /^image\/(jpeg|png|webp|gif|bmp|tiff)$/.test(file.type)
      || /\.(jpe?g|png|webp|gif|bmp|tiff?)$/i.test(file.name);
  }

  function isSupportedVideo(file) {
    return /^video\/(mp4|quicktime|x-m4v|webm|x-msvideo|avi)$/.test(file.type)
      || /\.(mp4|mov|m4v|webm|avi)$/i.test(file.name);
  }

  function mediaTypeFromName(name) {
    if (/\.(mp4|mov|m4v|webm|avi)$/i.test(name)) return 'video';
    if (/\.(jpe?g|png|webp|gif|bmp|tiff?)$/i.test(name)) return 'image';
    return 'unknown';
  }

  function safeFfmpegName(name) {
    return (name || 'video')
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      || 'video';
  }

  function strongestConfidence(signals) {
    const rank = { high: 3, medium: 2, low: 1 };
    return signals.reduce((best, signal) => {
      const current = (signal.confidence || '').toLowerCase();
      return (rank[current] || 0) > (rank[best] || 0) ? current : best;
    }, 'none');
  }

  function dedupe(items) {
    return Array.from(new Set(items.filter(Boolean)));
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

  // ─── Theme ───────────────────────────────────────────────────────
  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    if (themeBtn) themeBtn.textContent = theme === 'light' ? '☽' : '☀';
    localStorage.setItem('theme', theme);
  }

  themeBtn?.addEventListener('click', () => {
    applyTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light');
  });

  // ─── Open-sample button ──────────────────────────────────────────
  const openSampleBtn = document.querySelector('#open-sample');
  openSampleBtn?.addEventListener('click', async () => {
    ga('sample_opened', {});
    let samplesData = [];
    try {
      // Fetch the samples data (built as static JSON by Astro)
      const res = await fetch('/src/data/samples.json').catch(() => null)
        ?? await fetch('/data/samples.json').catch(() => null);
      if (res?.ok) samplesData = await res.json();
    } catch {
      samplesData = [];
    }

    if (!Array.isArray(samplesData) || samplesData.length === 0) {
      setStatus(t('sample.soon') || '样本即将上线');
      return;
    }

    // Non-empty branch: load first sample's fileRef and run analysis
    const sample = samplesData[0];
    if (!sample?.fileRef) {
      setStatus(t('sample.soon') || '样本即将上线');
      return;
    }
    try {
      setStatus(t('status.loading_engine') || '正在加载样本…');
      const res = await fetch(sample.fileRef);
      if (!res.ok) throw new Error(`Failed to fetch sample: ${res.status}`);
      const blob = await res.blob();
      const ext = sample.fileRef.split('.').pop() || 'bin';
      const file = new File([blob], `${sample.id}.${ext}`, { type: blob.type });
      selectedFiles = [file];
      renderSelectedFiles(selectedFiles);
      syncAnalyzeButton();
      analyzeBtn.click();
    } catch (err) {
      setStatus((t('status.error') || 'Error: ') + (err?.message || String(err)), true);
    }
  });

  // ─── Hamburger ───────────────────────────────────────────────────
  hamburger?.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    mobileMenu?.classList.toggle('open', !expanded);
    mobileMenu?.setAttribute('aria-hidden', String(expanded));
  });

  document.addEventListener('click', (e) => {
    if (hamburger && mobileMenu && !hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }
  });
}

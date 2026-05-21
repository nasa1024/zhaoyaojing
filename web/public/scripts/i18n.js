const translations = {
  'zh-CN': {
    'page.title':       'AICheck365 · AI 图片检测 | 免费识别 AI 生成图片',
    'page.description': '免费检测图片是否由 AI 生成。基于 EXIF、XMP、C2PA 元数据分析，支持 Midjourney、DALL-E、Stable Diffusion 等主流平台。完全在浏览器本地运行，不上传图片。',

    'eyebrow':              'AI 图片来源检测',
    'hero.h1':              'AI 图片溯源检测',
    'hero.lead':            '图片只在你的浏览器里<strong>本地分析，不上传服务器</strong>。识别图片元数据、平台痕迹和文件名来源信号。',
    'metric.uploads.value': '0',
    'metric.uploads.label': '服务器上传',
    'metric.local.value':   '100%',
    'metric.local.label':   '本地运行',

    'trust.privacy':       '隐私优先',
    'trust.privacy.desc':  '文件只在当前浏览器内读取',
    'trust.original':      '适合原图检测',
    'trust.original.desc': '保留元数据的原始图片命中率更高',
    'trust.explain':       '结果可解释',
    'trust.explain.desc':  '展示命中来源、置信度和具体字段',

    'notice': '<strong>重要提示：</strong>这不是万能 AI 鉴定器。它只基于 EXIF / XMP / PNG 文本块 / 文件名等来源信号做辅助判断。如果图片经过社交平台压缩、截图、重新导出或清洗元数据，很多信号会直接消失。',

    'upload.title':           '上传图片',
    'upload.subtitle':        '选择一张图片后点击检测。所有分析都在本机完成。',
    'upload.zone.title':      '点击或拖拽图片到此处',
    'upload.zone.formats':    '支持 JPEG / PNG / WebP / GIF / BMP / TIFF',
    'upload.button':          '开始检测',
    'upload.status.init':     '正在初始化…',

    'platforms.title': '可识别的平台 / 工具',
    'platforms.desc':  '这里只代表<strong>当前可识别的来源痕迹范围</strong>，不代表支持所有 AI 图片平台，更不代表能只看像素就断定真伪。',
    'signals.title':   '支持的信号类型',
    'formats.title':   '支持格式',

    'results.title':    '检测结果',
    'results.subtitle': '结果会列出命中的信号、置信度、字段详情和限制说明。',
    'results.empty':    '选一张原始图片试试。越原始的文件，越容易保留可检测的来源信号。',
    'skeleton':         '加载中…',
    'lang.switch':      'EN',

    // dynamic — used by main.js via t()
    'status.ready':       '就绪，可以开始检测。',
    'status.error':       '初始化失败，请刷新重试。',
    'status.no_file':     '还没有选择文件。',
    'status.selected':    '已选择：',
    'status.analyzing':   '正在本地分析图片…',
    'status.done':        '分析完成。',
    'status.unsupported': '请选择 JPEG / PNG / WebP / GIF / BMP / TIFF 图片文件。',
    'btn.idle':           '开始检测',
    'btn.running':        '检测中…',

    'report.ai_yes':           '检测到 AI 来源信号',
    'report.ai_no':            '未检测到已知 AI 来源信号',
    'report.no_signals':       '没检测到已知 AI 来源信号。注意：这不等于图片一定不是 AI 生成。',
    'report.no_limitations':   '没有额外限制说明。',
    'report.label.filename':   '文件名',
    'report.label.mime':       'MIME 类型',
    'report.label.mode':       '模式',
    'report.label.signals':    '信号数量',
    'report.heading.signals':  '命中的信号',
    'report.heading.limits':   '限制与风险提示',
  },

  'en': {
    'page.title':       'AICheck365 · AI Image Detector | Free AI-Generated Image Detection',
    'page.description': 'Free tool to detect AI-generated images. Analyzes EXIF, XMP, and C2PA metadata. Supports Midjourney, DALL-E, Stable Diffusion, and more. Runs entirely in your browser — no uploads.',

    'eyebrow':              'AI Image Origin Detection',
    'hero.h1':              'AI Image Origin Detector',
    'hero.lead':            'Images are analyzed <strong>locally in your browser — nothing is uploaded</strong>. Detects metadata, platform traces, and filename origin signals.',
    'metric.uploads.value': '0',
    'metric.uploads.label': 'Server Uploads',
    'metric.local.value':   '100%',
    'metric.local.label':   'Local Processing',

    'trust.privacy':       'Privacy First',
    'trust.privacy.desc':  'Files are only read inside your browser',
    'trust.original':      'Best with Originals',
    'trust.original.desc': 'Unmodified files retain more detectable signals',
    'trust.explain':       'Explainable Results',
    'trust.explain.desc':  'Shows signal source, confidence, and field details',

    'notice': '<strong>Important:</strong> This is not a magic AI detector. It only uses EXIF / XMP / PNG text chunks / filename signals as supplementary indicators. If the image was compressed by social platforms, screenshotted, re-exported, or had metadata stripped, most signals will disappear.',

    'upload.title':        'Upload Image',
    'upload.subtitle':     'Select an image and click Analyze. All processing happens locally.',
    'upload.zone.title':   'Click or drag an image here',
    'upload.zone.formats': 'JPEG / PNG / WebP / GIF / BMP / TIFF supported',
    'upload.button':       'Analyze',
    'upload.status.init':  'Initializing…',

    'platforms.title': 'Detectable Platforms / Tools',
    'platforms.desc':  'This only represents <strong>currently detectable trace patterns</strong>. It does not cover all AI platforms and cannot determine authenticity from pixels alone.',
    'signals.title':   'Supported Signal Types',
    'formats.title':   'Supported Formats',

    'results.title':    'Detection Results',
    'results.subtitle': 'Results list matched signals, confidence levels, field details, and limitations.',
    'results.empty':    'Try an original image. The less processed it is, the more detectable signals it retains.',
    'skeleton':         'Loading…',
    'lang.switch':      '中文',

    'status.ready':       'Ready to analyze.',
    'status.error':       'Initialization failed. Please refresh.',
    'status.no_file':     'No file selected.',
    'status.selected':    'Selected: ',
    'status.analyzing':   'Analyzing image locally…',
    'status.done':        'Analysis complete.',
    'status.unsupported': 'Please select a JPEG / PNG / WebP / GIF / BMP / TIFF image.',
    'btn.idle':           'Analyze',
    'btn.running':        'Analyzing…',

    'report.ai_yes':           'AI Origin Signals Detected',
    'report.ai_no':            'No Known AI Origin Signals Found',
    'report.no_signals':       'No known AI origin signals detected. Note: this does not mean the image is not AI-generated.',
    'report.no_limitations':   'No additional limitations.',
    'report.label.filename':   'Filename',
    'report.label.mime':       'MIME Type',
    'report.label.mode':       'Mode',
    'report.label.signals':    'Signal Count',
    'report.heading.signals':  'Matched Signals',
    'report.heading.limits':   'Limitations & Risk Notes',
  },
};

function detectLang() {
  const stored = localStorage.getItem('lang');
  if (stored && translations[stored]) return stored;
  return navigator.language.startsWith('zh') ? 'zh-CN' : 'en';
}

let currentLang = detectLang();

export function t(key) {
  return translations[currentLang]?.[key] ?? translations['zh-CN']?.[key] ?? key;
}

export function getCurrentLang() {
  return currentLang;
}

export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyI18n();
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function applyI18n() {
  document.documentElement.lang = currentLang;
  document.title = t('page.title');
  document.querySelector('meta[name="description"]')
    ?.setAttribute('content', t('page.description'));
  document.querySelector('meta[property="og:locale"]')
    ?.setAttribute('content', currentLang === 'zh-CN' ? 'zh_CN' : 'en_US');
  document.querySelector('meta[property="og:title"]')
    ?.setAttribute('content', t('page.title'));
  document.querySelector('meta[property="og:description"]')
    ?.setAttribute('content', t('page.description'));

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  const langBtn = document.getElementById('lang-switch');
  if (langBtn) langBtn.textContent = t('lang.switch');
}

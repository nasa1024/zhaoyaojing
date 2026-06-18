// ─── Translations ───────────────────────────────────────────────
const translations = {

  // ── Simplified Chinese ──────────────────────────────────────────
  'zh-CN': {
    'nav.tool':         '检测工具',
    'nav.platforms':    '平台指南',
    'nav.blog':         '知识库',
    'nav.about':        '关于',
    'nav.privacy':      '隐私政策',
    'nav.terms':        '服务条款',
    'nav.contact':      '联系',
    'footer.note':      `© ${new Date().getFullYear()} AICheck365 · 图片/视频仅在本地浏览器分析，不上传服务器`,
    'page.title':       'AICheck365 · AI 图片/视频检测 | 免费识别 AI 生成内容',
    'page.description': '在浏览器本地检测图片/视频里的 AI 来源线索。支持 EXIF、XMP、C2PA、PNG 文本块、MP4/MOV 元数据和视频帧水印线索，不上传文件。',
    'eyebrow':               'AI 图片/视频来源检测',
    'hero.h1':               '别问它"像不像 AI"，看看它留下了什么',
    'hero.lead':             '拖入原始图片或视频。AICheck365 会检查 C2PA、EXIF、XMP、PNG 文本、生成参数和视频容器中的来源线索。',
    'hero.privacy':          '文件在你的浏览器中处理，不会离开你的设备。',
    'hero.cta.primary':      '拖入原始文件',
    'hero.cta.secondary':    '先拆一个真实样本',
    'metric.uploads.value':  '0',
    'metric.uploads.label':  '服务器上传',
    'metric.local.value':    '100%',
    'metric.local.label':    '本地运行',
    'trust.privacy':         '隐私优先',
    'trust.privacy.desc':    '文件只在当前浏览器内读取',
    'trust.original':        '适合原图检测',
    'trust.original.desc':   '保留元数据的原始文件命中率更高',
    'trust.explain':         '结果可解释',
    'trust.explain.desc':    '列出命中的字段和置信度',
    'notice':                '<strong>重要提示：</strong>这不是万能 AI 鉴定器。它只读取当前文件里还保留的 EXIF / XMP / C2PA / PNG 文本块 / MP4/MOV 元数据 / 文件名等线索。视频帧分析会在本地浏览器执行，可能较慢。经过社交平台压缩、截图或重新导出的文件，很多信号会消失。',
    'upload.title':          '上传图片/视频',
    'upload.subtitle':       '选择图片或视频后点击检测。所有分析都在本机完成，视频帧分析可能较慢。',
    'upload.zone.title':     '点击或拖拽图片/视频到此处',
    'upload.zone.formats':   '支持 JPEG / PNG / WebP / GIF / BMP / TIFF / MP4 / MOV / M4V / WebM / AVI',
    'upload.button':         '开始检测',
    'upload.status.init':    '正在初始化…',
    'platforms.title':       '可识别的平台 / 工具',
    'platforms.desc':        '这里只代表<strong>当前可识别的来源痕迹范围</strong>，不代表支持所有 AI 图片/视频平台，更不代表能只看像素就断定真伪。',
    'signals.title':         '支持的信号类型',
    'formats.title':         '支持格式',
    'results.title':         '检测结果',
    'results.subtitle':      '结果会列出命中的信号、置信度、字段详情和限制说明。',
    'results.empty':         '选一个原始文件试试。越原始的文件，越容易保留可检测的来源信号。',
    'skeleton':              '加载中…',
    'status.ready':          '就绪，可以开始检测。',
    'status.error':          '初始化失败，请刷新重试。',
    'status.no_file':        '还没有选择文件。',
    'status.selected':       '已选择：',
    'status.analyzing':      '正在本地分析文件…',
    'status.done':           '分析完成。',
    'status.unsupported':    '请选择支持的图片或视频文件。',
    'btn.idle':              '开始检测',
    'btn.running':           '检测中…',
    'upload.files.selected': '个文件已选择',
    'history.title':         '最近检测',
    'history.subtitle':      '点击可重新查看结果（仅保存在本地浏览器）',
    'history.empty':         '暂无检测记录。',
    'share.button':          '📋 复制报告',
    'share.copied':          '✓ 已复制',
    'batch.files':           '个文件',
    'batch.ai_detected':     '个检测到 AI 信号',
    'report.ai_yes':         '检测到 AI 来源信号',
    'report.ai_no':          '未检测到已知 AI 来源信号',
    'report.no_signals':     '没检测到已知 AI 来源信号。注意：这不等于文件一定不是 AI 生成。',
    'report.no_limitations': '没有额外限制说明。',
    'report.label.filename': '文件名',
    'report.label.mime':     'MIME 类型',
    'report.label.media_type':'媒体类型',
    'report.label.mode':     '模式',
    'report.label.signals':  '信号数量',
    'report.heading.signals':'命中的信号',
    'report.heading.limits': '限制与风险提示',
    'video.frame_failed':    '视频帧分析未完成',
    'video.no_frames':       '未能抽取可分析的视频帧',
    'sample.soon':           '样本即将上线',
    'status.loading_engine': '正在加载检测引擎…',
  },

  // ── Traditional Chinese ─────────────────────────────────────────
  'zh-TW': {
    'nav.tool':         '檢測工具',
    'nav.platforms':    '平台指南',
    'nav.blog':         '知識庫',
    'nav.about':        '關於',
    'nav.privacy':      '隱私政策',
    'nav.terms':        '服務條款',
    'nav.contact':      '聯繫',
    'footer.note':      `© ${new Date().getFullYear()} AICheck365 · 圖片/影片僅在本地瀏覽器分析，不上傳伺服器`,
    'page.title':       'AICheck365 · AI 圖片/影片檢測 | 免費識別 AI 生成內容',
    'page.description': '在瀏覽器本地檢查圖片/影片裡的 AI 來源線索。支援 EXIF、XMP、C2PA、PNG 文字區塊、MP4/MOV 元數據與影片幀浮水印線索，不上傳檔案。',
    'eyebrow':               'AI 圖片/影片來源偵測',
    'hero.h1':               'AI 圖片/影片溯源偵測',
    'hero.lead':             '圖片和影片只在你的瀏覽器裡<strong>本地分析，不上傳伺服器</strong>。識別元數據、平台痕跡、檔案名稱和影片幀浮水印。',
    'metric.uploads.value':  '0',
    'metric.uploads.label':  '伺服器上傳',
    'metric.local.value':    '100%',
    'metric.local.label':    '本地執行',
    'trust.privacy':         '隱私優先',
    'trust.privacy.desc':    '檔案只在目前瀏覽器內讀取',
    'trust.original':        '適合原圖偵測',
    'trust.original.desc':   '保留元數據的原始檔案命中率更高',
    'trust.explain':         '結果可解釋',
    'trust.explain.desc':    '顯示命中來源、可信度與具體欄位',
    'notice':                '<strong>重要提示：</strong>這不是萬能 AI 鑑定器。它只基於 EXIF / XMP / C2PA / PNG 文字區塊 / MP4/MOV 元數據 / 檔案名稱等來源訊號做輔助判斷。影片幀分析會在本地瀏覽器執行，可能較慢。若檔案經社群平台壓縮、截圖、重新匯出或清除元數據，很多訊號會直接消失。',
    'upload.title':          '上傳圖片/影片',
    'upload.subtitle':       '選擇圖片或影片後點擊偵測。所有分析都在本機完成，影片幀分析可能較慢。',
    'upload.zone.title':     '點擊或拖曳圖片/影片到此處',
    'upload.zone.formats':   '支援 JPEG / PNG / WebP / GIF / BMP / TIFF / MP4 / MOV / M4V / WebM / AVI',
    'upload.button':         '開始偵測',
    'upload.status.init':    '正在初始化…',
    'platforms.title':       '可識別的平台 / 工具',
    'platforms.desc':        '這裡只代表<strong>目前可識別的來源痕跡範圍</strong>，不代表支援所有 AI 圖片/影片平台，更不代表能只看像素就斷定真偽。',
    'signals.title':         '支援的訊號類型',
    'formats.title':         '支援格式',
    'results.title':         '偵測結果',
    'results.subtitle':      '結果會列出命中的訊號、可信度、欄位詳情和限制說明。',
    'results.empty':         '選一個原始檔案試試。越原始的檔案，越容易保留可偵測的來源訊號。',
    'skeleton':              '載入中…',
    'status.ready':          '就緒，可以開始偵測。',
    'status.error':          '初始化失敗，請重新整理。',
    'status.no_file':        '尚未選擇檔案。',
    'status.selected':       '已選擇：',
    'status.analyzing':      '正在本地分析檔案…',
    'status.done':           '分析完成。',
    'status.unsupported':    '請選擇支援的圖片或影片檔案。',
    'btn.idle':              '開始偵測',
    'btn.running':           '偵測中…',
    'upload.files.selected': '個檔案已選擇',
    'history.title':         '最近偵測',
    'history.subtitle':      '點擊可重新查看結果（僅保存在本地瀏覽器）',
    'history.empty':         '暫無偵測記錄。',
    'share.button':          '📋 複製報告',
    'share.copied':          '✓ 已複製',
    'batch.files':           '個檔案',
    'batch.ai_detected':     '個偵測到 AI 訊號',
    'report.ai_yes':         '偵測到 AI 來源訊號',
    'report.ai_no':          '未偵測到已知 AI 來源訊號',
    'report.no_signals':     '未偵測到已知 AI 來源訊號。注意：這不等於檔案一定不是 AI 生成。',
    'report.no_limitations': '沒有額外限制說明。',
    'report.label.filename': '檔案名稱',
    'report.label.mime':     'MIME 類型',
    'report.label.media_type':'媒體類型',
    'report.label.mode':     '模式',
    'report.label.signals':  '訊號數量',
    'report.heading.signals':'命中的訊號',
    'report.heading.limits': '限制與風險提示',
    'video.frame_failed':    '影片幀分析未完成',
    'video.no_frames':       '未能抽取可分析的影片幀',
    'sample.soon':           '樣本即將上線',
    'status.loading_engine': '正在載入偵測引擎…',
  },

  // ── English ─────────────────────────────────────────────────────
  'en': {
    'nav.tool':         'Detector',
    'nav.platforms':    'Platform Guides',
    'nav.blog':         'Blog',
    'nav.about':        'About',
    'nav.privacy':      'Privacy Policy',
    'nav.terms':        'Terms',
    'nav.contact':      'Contact',
    'footer.note':      `© ${new Date().getFullYear()} AICheck365 · Images and videos are analyzed locally in your browser, never uploaded`,
    'page.title':       'AICheck365 · AI Image/Video Detector | Free AI-Generated Media Detection',
    'page.description': 'Check AI-origin clues in image and video files locally in your browser. Reads EXIF, XMP, C2PA, PNG text chunks, MP4/MOV metadata, and video-frame watermark clues. No uploads.',
    'eyebrow':               'AI Image/Video Origin Detection',
    'hero.h1':               'Don\'t ask if it looks like AI — see what it left behind',
    'hero.lead':             'Drop in an original image or video. AICheck365 inspects the C2PA, EXIF, XMP, PNG text, generation parameters, and video-container origin clues.',
    'hero.privacy':          'Files are processed in your browser and never leave your device.',
    'hero.cta.primary':      'Drop an original file',
    'hero.cta.secondary':    'Inspect a real sample first',
    'metric.uploads.value':  '0',
    'metric.uploads.label':  'Server Uploads',
    'metric.local.value':    '100%',
    'metric.local.label':    'Local Processing',
    'trust.privacy':         'Privacy First',
    'trust.privacy.desc':    'Files are only read inside your browser',
    'trust.original':        'Best with Originals',
    'trust.original.desc':   'Original files retain more detectable signals',
    'trust.explain':         'Explainable Results',
    'trust.explain.desc':    'Lists matched fields and confidence',
    'notice':                '<strong>Important:</strong> This is not a magic AI detector. It only uses EXIF / XMP / C2PA / PNG text chunks / MP4/MOV metadata / filename signals as supplementary indicators. Video-frame analysis runs locally in the browser and may be slow. If a file was compressed by social platforms, screenshotted, re-exported, or had metadata stripped, most signals will disappear.',
    'upload.title':          'Upload Image/Video',
    'upload.subtitle':       'Select an image or video and click Analyze. All processing happens locally; video-frame analysis may be slower.',
    'upload.zone.title':     'Click or drag an image/video here',
    'upload.zone.formats':   'JPEG / PNG / WebP / GIF / BMP / TIFF / MP4 / MOV / M4V / WebM / AVI supported',
    'upload.button':         'Analyze',
    'upload.status.init':    'Initializing…',
    'platforms.title':       'Detectable Platforms / Tools',
    'platforms.desc':        'This only represents <strong>currently detectable trace patterns</strong>. It does not cover all AI platforms and cannot determine authenticity from pixels alone.',
    'signals.title':         'Supported Signal Types',
    'formats.title':         'Supported Formats',
    'results.title':         'Detection Results',
    'results.subtitle':      'Results list matched signals, confidence levels, field details, and limitations.',
    'results.empty':         'Try an original file. The less processed it is, the more detectable signals it retains.',
    'skeleton':              'Loading…',
    'status.ready':          'Ready to analyze.',
    'status.error':          'Initialization failed. Please refresh.',
    'status.no_file':        'No file selected.',
    'status.selected':       'Selected: ',
    'status.analyzing':      'Analyzing file locally…',
    'status.done':           'Analysis complete.',
    'status.unsupported':    'Please select a supported image or video file.',
    'btn.idle':              'Analyze',
    'btn.running':           'Analyzing…',
    'upload.files.selected': 'files selected',
    'history.title':         'Recent Detections',
    'history.subtitle':      'Click to review past results (stored locally only)',
    'history.empty':         'No recent detections yet.',
    'share.button':          '📋 Copy Report',
    'share.copied':          '✓ Copied!',
    'batch.files':           'files',
    'batch.ai_detected':     'with AI signals',
    'report.ai_yes':         'AI Origin Signals Detected',
    'report.ai_no':          'No Known AI Origin Signals Found',
    'report.no_signals':     'No known AI origin signals detected. Note: this does not mean the file is not AI-generated.',
    'report.no_limitations': 'No additional limitations.',
    'report.label.filename': 'Filename',
    'report.label.mime':     'MIME Type',
    'report.label.media_type':'Media Type',
    'report.label.mode':     'Mode',
    'report.label.signals':  'Signal Count',
    'report.heading.signals':'Matched Signals',
    'report.heading.limits': 'Limitations & Risk Notes',
    'video.frame_failed':    'Video frame analysis was not completed',
    'video.no_frames':       'No decodable video frames were extracted',
    'sample.soon':           'Samples coming soon',
    'status.loading_engine': 'Loading detection engine…',
  },

  // ── Japanese ─────────────────────────────────────────────────────
  'ja': {
    'nav.tool':         '検出ツール',
    'nav.platforms':    'プラットフォーム',
    'nav.blog':         'ブログ',
    'nav.about':        'について',
    'nav.privacy':      'プライバシー',
    'nav.terms':        '利用規約',
    'nav.contact':      'お問い合わせ',
    'footer.note':      `© ${new Date().getFullYear()} AICheck365 · 画像と動画はブラウザ内でローカル分析されます`,
    'page.title':       'AICheck365 · AI画像/動画検出 | AI生成メディアを無料で識別',
    'page.description': '画像/動画ファイル内のAI由来の手がかりをブラウザ上でローカル確認。EXIF・XMP・C2PA・PNGテキストチャンク・MP4/MOVメタデータ・動画フレーム透かしを読み取ります。アップロード不要。',
    'eyebrow':               'AI画像/動画の出所検出',
    'hero.h1':               'AI画像/動画 出所検出ツール',
    'hero.lead':             '画像と動画はブラウザ内で<strong>ローカル分析されます — サーバーへのアップロードなし</strong>。メタデータ・プラットフォーム痕跡・ファイル名・動画フレーム透かしを検出します。',
    'metric.uploads.value':  '0',
    'metric.uploads.label':  'サーバーアップロード',
    'metric.local.value':    '100%',
    'metric.local.label':    'ローカル処理',
    'trust.privacy':         'プライバシー優先',
    'trust.privacy.desc':    'ファイルはブラウザ内でのみ読み込まれます',
    'trust.original':        'オリジナル画像に最適',
    'trust.original.desc':   'メタデータを保持した元の画像は検出率が高くなります',
    'trust.explain':         '説明可能な結果',
    'trust.explain.desc':    'シグナルの出所・信頼度・詳細フィールドを表示',
    'notice':                '<strong>重要：</strong>これは万能のAI判定ツールではありません。EXIF / XMP / PNGテキストチャンク / ファイル名などのシグナルによる補助的な判断のみ行います。SNSによる圧縮・スクリーンショット・再エクスポート・メタデータの削除が行われた画像は、ほとんどのシグナルが失われます。',
    'upload.title':          '画像/動画をアップロード',
    'upload.subtitle':       '画像または動画を選択して「検出」をクリックしてください。すべての処理はローカルで行われます。',
    'upload.zone.title':     '画像/動画をクリックまたはドラッグ',
    'upload.zone.formats':   'JPEG / PNG / WebP / GIF / BMP / TIFF / MP4 / MOV / M4V / WebM / AVI 対応',
    'upload.button':         '検出開始',
    'upload.status.init':    '初期化中…',
    'platforms.title':       '検出可能なプラットフォーム / ツール',
    'platforms.desc':        'これは<strong>現在検出可能な痕跡パターンの範囲</strong>を示すものです。すべてのAIプラットフォームに対応しているわけではなく、ピクセルのみで真偽を判断することもできません。',
    'signals.title':         '対応シグナルタイプ',
    'formats.title':         '対応フォーマット',
    'results.title':         '検出結果',
    'results.subtitle':      '一致したシグナル・信頼度・フィールド詳細・制限事項が表示されます。',
    'results.empty':         'オリジナル画像を試してください。処理が少ないほど、検出可能なシグナルが多く残ります。',
    'skeleton':              '読み込み中…',
    'status.ready':          '準備完了。検出を開始できます。',
    'status.error':          '初期化に失敗しました。ページを更新してください。',
    'status.no_file':        'ファイルが選択されていません。',
    'status.selected':       '選択済み：',
    'status.analyzing':      'ローカルでファイルを分析中…',
    'status.done':           '分析完了。',
    'status.unsupported':    '対応する画像または動画ファイルを選択してください。',
    'btn.idle':              '検出開始',
    'btn.running':           '検出中…',
    'report.ai_yes':         'AI出所シグナルを検出',
    'report.ai_no':          '既知のAI出所シグナルは検出されませんでした',
    'report.no_signals':     '既知のAI出所シグナルは検出されませんでした。注意：これはファイルがAI生成でないことを意味しません。',
    'report.no_limitations': '追加の制限事項はありません。',
    'report.label.filename': 'ファイル名',
    'report.label.mime':     'MIMEタイプ',
    'report.label.media_type':'メディアタイプ',
    'report.label.mode':     'モード',
    'report.label.signals':  'シグナル数',
    'report.heading.signals':'一致したシグナル',
    'report.heading.limits': '制限とリスク',
  },

  // ── Korean ───────────────────────────────────────────────────────
  'ko': {
    'nav.tool':         '감지 도구',
    'nav.platforms':    '플랫폼 가이드',
    'nav.blog':         '블로그',
    'nav.about':        '소개',
    'nav.privacy':      '개인정보처리방침',
    'nav.terms':        '이용약관',
    'nav.contact':      '문의',
    'footer.note':      `© ${new Date().getFullYear()} AICheck365 · 이미지와 비디오는 브라우저에서 로컬로 분석됩니다`,
    'page.title':       'AICheck365 · AI 이미지/동영상 감지 | AI 생성 미디어 무료 식별',
    'page.description': '브라우저에서 이미지/동영상 파일의 AI 출처 단서를 로컬로 확인합니다. EXIF, XMP, C2PA, PNG 텍스트 청크, MP4/MOV 메타데이터, 동영상 프레임 워터마크를 읽습니다. 업로드 없음.',
    'eyebrow':               'AI 이미지/동영상 출처 감지',
    'hero.h1':               'AI 이미지/동영상 출처 탐지기',
    'hero.lead':             '이미지와 동영상은 브라우저에서 <strong>로컬로 분석됩니다 — 서버 업로드 없음</strong>. 메타데이터, 플랫폼 흔적, 파일명, 동영상 프레임 워터마크를 감지합니다.',
    'metric.uploads.value':  '0',
    'metric.uploads.label':  '서버 업로드',
    'metric.local.value':    '100%',
    'metric.local.label':    '로컬 처리',
    'trust.privacy':         '프라이버시 우선',
    'trust.privacy.desc':    '파일은 브라우저 내에서만 읽힙니다',
    'trust.original':        '원본 이미지에 최적',
    'trust.original.desc':   '메타데이터가 보존된 원본 파일의 감지율이 높습니다',
    'trust.explain':         '설명 가능한 결과',
    'trust.explain.desc':    '신호 출처, 신뢰도, 필드 상세 정보 표시',
    'notice':                '<strong>중요:</strong> 이것은 만능 AI 판별기가 아닙니다. EXIF / XMP / C2PA / PNG 텍스트 청크 / 파일명 신호를 보조 지표로만 사용합니다. SNS 압축, 스크린샷, 재내보내기, 메타데이터 제거를 거친 이미지는 대부분의 신호가 사라집니다.',
    'upload.title':          '이미지/동영상 업로드',
    'upload.subtitle':       '이미지 또는 동영상을 선택하고 분석을 클릭하세요. 모든 처리는 로컬에서 이루어집니다.',
    'upload.zone.title':     '클릭하거나 이미지/동영상을 드래그하세요',
    'upload.zone.formats':   'JPEG / PNG / WebP / GIF / BMP / TIFF / MP4 / MOV / M4V / WebM / AVI 지원',
    'upload.button':         '분석 시작',
    'upload.status.init':    '초기화 중…',
    'platforms.title':       '감지 가능한 플랫폼 / 도구',
    'platforms.desc':        '이것은 <strong>현재 감지 가능한 흔적 패턴의 범위</strong>를 나타냅니다. 모든 AI 플랫폼을 지원하지 않으며, 픽셀만으로 진위를 판단할 수 없습니다.',
    'signals.title':         '지원 신호 유형',
    'formats.title':         '지원 형식',
    'results.title':         '감지 결과',
    'results.subtitle':      '일치하는 신호, 신뢰도, 필드 세부 정보, 제한 사항이 표시됩니다.',
    'results.empty':         '원본 이미지를 시도해보세요. 처리가 적을수록 더 많은 신호가 남아 있습니다.',
    'skeleton':              '로딩 중…',
    'status.ready':          '준비 완료. 분석을 시작할 수 있습니다.',
    'status.error':          '초기화에 실패했습니다. 페이지를 새로 고침하세요.',
    'status.no_file':        '파일이 선택되지 않았습니다.',
    'status.selected':       '선택됨: ',
    'status.analyzing':      '로컬에서 파일 분석 중…',
    'status.done':           '분석 완료.',
    'status.unsupported':    '지원되는 이미지 또는 동영상 파일을 선택하세요.',
    'btn.idle':              '분석 시작',
    'btn.running':           '분석 중…',
    'report.ai_yes':         'AI 출처 신호 감지됨',
    'report.ai_no':          '알려진 AI 출처 신호 없음',
    'report.no_signals':     '알려진 AI 출처 신호가 감지되지 않았습니다. 참고: 이것이 파일이 AI 생성이 아님을 의미하지는 않습니다.',
    'report.no_limitations': '추가 제한 사항 없음.',
    'report.label.filename': '파일명',
    'report.label.mime':     'MIME 타입',
    'report.label.media_type':'미디어 타입',
    'report.label.mode':     '모드',
    'report.label.signals':  '신호 수',
    'report.heading.signals':'일치한 신호',
    'report.heading.limits': '제한 사항 및 위험 안내',
  },

  // ── German ───────────────────────────────────────────────────────
  'de': {
    'nav.tool':         'Detektor',
    'nav.platforms':    'Plattform-Guides',
    'nav.blog':         'Blog',
    'nav.about':        'Über uns',
    'nav.privacy':      'Datenschutz',
    'nav.terms':        'Nutzungsbedingungen',
    'nav.contact':      'Kontakt',
    'footer.note':      `© ${new Date().getFullYear()} AICheck365 · Bilder und Videos werden lokal im Browser analysiert`,
    'page.title':       'AICheck365 · KI-Bild-/Videoerkennung | KI-generierte Medien kostenlos erkennen',
    'page.description': 'Prüft Hinweise auf KI-Herkunft in Bild- und Videodateien direkt im Browser. Liest EXIF, XMP, C2PA, PNG-Text-Chunks, MP4/MOV-Metadaten und Video-Frame-Wasserzeichen. Keine Uploads.',
    'eyebrow':               'KI-Bild-/Videoherkunft erkennen',
    'hero.h1':               'KI-Bild-/Video-Herkunftsdetektor',
    'hero.lead':             'Bilder und Videos werden <strong>lokal in Ihrem Browser analysiert — kein Server-Upload</strong>. Erkennt Metadaten, Plattform-Spuren, Dateinamen und Video-Frame-Wasserzeichen.',
    'metric.uploads.value':  '0',
    'metric.uploads.label':  'Server-Uploads',
    'metric.local.value':    '100%',
    'metric.local.label':    'Lokale Verarbeitung',
    'trust.privacy':         'Datenschutz zuerst',
    'trust.privacy.desc':    'Dateien werden nur im Browser gelesen',
    'trust.original':        'Am besten mit Originalen',
    'trust.original.desc':   'Unbearbeitete Dateien behalten mehr erkennbare Signale',
    'trust.explain':         'Nachvollziehbare Ergebnisse',
    'trust.explain.desc':    'Zeigt Signalquelle, Konfidenz und Felddetails',
    'notice':                '<strong>Wichtig:</strong> Dies ist kein universeller KI-Detektor. Es werden nur EXIF / XMP / PNG-Textblöcke / Dateinamen-Signale als ergänzende Indikatoren verwendet. Wenn das Bild von sozialen Plattformen komprimiert, per Screenshot erstellt, re-exportiert oder Metadaten entfernt wurden, verschwinden die meisten Signale.',
    'upload.title':          'Bild/Video hochladen',
    'upload.subtitle':       'Wählen Sie ein Bild oder Video und klicken Sie auf „Analysieren". Die Verarbeitung erfolgt lokal.',
    'upload.zone.title':     'Klicken oder Bild/Video hierher ziehen',
    'upload.zone.formats':   'JPEG / PNG / WebP / GIF / BMP / TIFF / MP4 / MOV / M4V / WebM / AVI unterstützt',
    'upload.button':         'Analysieren',
    'upload.status.init':    'Initialisierung…',
    'platforms.title':       'Erkennbare Plattformen / Tools',
    'platforms.desc':        'Dies zeigt nur den <strong>aktuell erkennbaren Spurbereich</strong>. Nicht alle KI-Plattformen werden abgedeckt, und Authentizität kann nicht anhand von Pixeln allein bestimmt werden.',
    'signals.title':         'Unterstützte Signaltypen',
    'formats.title':         'Unterstützte Formate',
    'results.title':         'Erkennungsergebnisse',
    'results.subtitle':      'Ergebnisse zeigen übereinstimmende Signale, Konfidenz, Felddetails und Einschränkungen.',
    'results.empty':         'Probieren Sie ein Originalbild. Je weniger verarbeitet, desto mehr erkennbare Signale bleiben erhalten.',
    'skeleton':              'Lädt…',
    'status.ready':          'Bereit zur Analyse.',
    'status.error':          'Initialisierung fehlgeschlagen. Bitte aktualisieren.',
    'status.no_file':        'Keine Datei ausgewählt.',
    'status.selected':       'Ausgewählt: ',
    'status.analyzing':      'Datei wird lokal analysiert…',
    'status.done':           'Analyse abgeschlossen.',
    'status.unsupported':    'Bitte wählen Sie eine unterstützte Bild- oder Videodatei.',
    'btn.idle':              'Analysieren',
    'btn.running':           'Analysiert…',
    'report.ai_yes':         'KI-Herkunftssignale erkannt',
    'report.ai_no':          'Keine bekannten KI-Herkunftssignale gefunden',
    'report.no_signals':     'Keine bekannten KI-Herkunftssignale erkannt. Hinweis: Das bedeutet nicht, dass die Datei nicht KI-generiert ist.',
    'report.no_limitations': 'Keine weiteren Einschränkungen.',
    'report.label.filename': 'Dateiname',
    'report.label.mime':     'MIME-Typ',
    'report.label.media_type':'Medientyp',
    'report.label.mode':     'Modus',
    'report.label.signals':  'Signalanzahl',
    'report.heading.signals':'Übereinstimmende Signale',
    'report.heading.limits': 'Einschränkungen & Risikohinweise',
  },

  // ── French ───────────────────────────────────────────────────────
  'fr': {
    'nav.tool':         'Détecteur',
    'nav.platforms':    'Guides Plateformes',
    'nav.blog':         'Blog',
    'nav.about':        'À propos',
    'nav.privacy':      'Confidentialité',
    'nav.terms':        'Conditions',
    'nav.contact':      'Contact',
    'footer.note':      `© ${new Date().getFullYear()} AICheck365 · Les images et vidéos sont analysées localement dans votre navigateur`,
    'page.title':       'AICheck365 · Détecteur IA image/vidéo | Identifier les médias générés par IA gratuitement',
    'page.description': "Vérifiez localement les indices d'origine IA dans les images et vidéos. Lit EXIF, XMP, C2PA, blocs texte PNG, métadonnées MP4/MOV et filigranes de trames vidéo. Aucun upload.",
    'eyebrow':               "Détection d'origine IA image/vidéo",
    'hero.h1':               "Détecteur d'origine des images/vidéos IA",
    'hero.lead':             "Les images et vidéos sont analysées <strong>localement dans votre navigateur — aucun téléchargement</strong>. Détecte métadonnées, traces de plateforme, noms de fichiers et filigranes de trames vidéo.",
    'metric.uploads.value':  '0',
    'metric.uploads.label':  'Uploads serveur',
    'metric.local.value':    '100%',
    'metric.local.label':    'Traitement local',
    'trust.privacy':         'Confidentialité prioritaire',
    'trust.privacy.desc':    'Les fichiers sont lus uniquement dans votre navigateur',
    'trust.original':        'Meilleur avec les originaux',
    'trust.original.desc':   'Les fichiers non modifiés conservent plus de signaux détectables',
    'trust.explain':         'Résultats explicables',
    'trust.explain.desc':    'Affiche la source du signal, la confiance et les détails des champs',
    'notice':                "<strong>Important :</strong> Ce n'est pas un détecteur IA universel. Il utilise uniquement les signaux EXIF / XMP / blocs de texte PNG / nom de fichier comme indicateurs supplémentaires. Si l'image a été compressée par des plateformes sociales, capturée en screenshot, ré-exportée ou que ses métadonnées ont été supprimées, la plupart des signaux disparaissent.",
    'upload.title':          'Télécharger une image/vidéo',
    'upload.subtitle':       "Sélectionnez une image ou une vidéo et cliquez sur Analyser. Tout le traitement s'effectue localement.",
    'upload.zone.title':     'Cliquez ou déposez une image/vidéo ici',
    'upload.zone.formats':   'JPEG / PNG / WebP / GIF / BMP / TIFF / MP4 / MOV / M4V / WebM / AVI supportés',
    'upload.button':         'Analyser',
    'upload.status.init':    'Initialisation…',
    'platforms.title':       'Plateformes / Outils détectables',
    'platforms.desc':        "Cela représente uniquement la <strong>plage de traces actuellement détectables</strong>. Toutes les plateformes IA ne sont pas couvertes et l'authenticité ne peut pas être déterminée par les pixels seuls.",
    'signals.title':         'Types de signaux supportés',
    'formats.title':         'Formats supportés',
    'results.title':         'Résultats de détection',
    'results.subtitle':      'Les résultats listent les signaux correspondants, les niveaux de confiance, les détails des champs et les limitations.',
    'results.empty':         "Essayez une image originale. Moins elle est traitée, plus elle conserve de signaux détectables.",
    'skeleton':              'Chargement…',
    'status.ready':          'Prêt à analyser.',
    'status.error':          "Échec de l'initialisation. Veuillez actualiser.",
    'status.no_file':        'Aucun fichier sélectionné.',
    'status.selected':       'Sélectionné : ',
    'status.analyzing':      'Analyse du fichier en local…',
    'status.done':           'Analyse terminée.',
    'status.unsupported':    'Veuillez sélectionner une image ou vidéo prise en charge.',
    'btn.idle':              'Analyser',
    'btn.running':           'Analyse…',
    'report.ai_yes':         "Signaux d'origine IA détectés",
    'report.ai_no':          "Aucun signal d'origine IA connu détecté",
    'report.no_signals':     "Aucun signal d'origine IA connu détecté. Remarque : cela ne signifie pas que le fichier n'est pas généré par IA.",
    'report.no_limitations': 'Aucune limitation supplémentaire.',
    'report.label.filename': 'Nom de fichier',
    'report.label.mime':     'Type MIME',
    'report.label.media_type':'Type de média',
    'report.label.mode':     'Mode',
    'report.label.signals':  'Nombre de signaux',
    'report.heading.signals':"Signaux correspondants",
    'report.heading.limits': 'Limitations et notes de risque',
  },

  // ── Spanish ──────────────────────────────────────────────────────
  'es': {
    'nav.tool':         'Detector',
    'nav.platforms':    'Guías de Plataformas',
    'nav.blog':         'Blog',
    'nav.about':        'Acerca de',
    'nav.privacy':      'Privacidad',
    'nav.terms':        'Términos',
    'nav.contact':      'Contacto',
    'footer.note':      `© ${new Date().getFullYear()} AICheck365 · Las imágenes y videos se analizan localmente en tu navegador`,
    'page.title':       'AICheck365 · Detector de IA de imágenes/videos | Identificar medios generados por IA gratis',
    'page.description': 'Revisa indicios de origen IA en imágenes y videos directamente en el navegador. Lee EXIF, XMP, C2PA, texto PNG, metadatos MP4/MOV y marcas de agua de fotogramas. Sin subidas.',
    'eyebrow':               'Detección de origen IA de imágenes/videos',
    'hero.h1':               'Detector de origen de imágenes/videos IA',
    'hero.lead':             'Las imágenes y videos se analizan <strong>localmente en tu navegador — sin subidas al servidor</strong>. Detecta metadatos, rastros de plataformas, nombres de archivo y marcas de agua de fotogramas.',
    'metric.uploads.value':  '0',
    'metric.uploads.label':  'Subidas al servidor',
    'metric.local.value':    '100%',
    'metric.local.label':    'Procesamiento local',
    'trust.privacy':         'Privacidad primero',
    'trust.privacy.desc':    'Los archivos solo se leen dentro de tu navegador',
    'trust.original':        'Mejor con originales',
    'trust.original.desc':   'Los archivos sin modificar retienen más señales detectables',
    'trust.explain':         'Resultados explicables',
    'trust.explain.desc':    'Muestra fuente de señal, confianza y detalles de campo',
    'notice':                '<strong>Importante:</strong> Este no es un detector IA universal. Solo usa señales EXIF / XMP / bloques de texto PNG / nombre de archivo como indicadores suplementarios. Si la imagen fue comprimida por redes sociales, capturada en pantalla, re-exportada o se eliminaron sus metadatos, la mayoría de las señales desaparecerán.',
    'upload.title':          'Subir imagen/video',
    'upload.subtitle':       'Selecciona una imagen o video y haz clic en Analizar. Todo el procesamiento ocurre localmente.',
    'upload.zone.title':     'Haz clic o arrastra una imagen/video aquí',
    'upload.zone.formats':   'JPEG / PNG / WebP / GIF / BMP / TIFF / MP4 / MOV / M4V / WebM / AVI compatibles',
    'upload.button':         'Analizar',
    'upload.status.init':    'Inicializando…',
    'platforms.title':       'Plataformas / Herramientas detectables',
    'platforms.desc':        'Esto solo representa el <strong>rango de patrones de rastro actualmente detectables</strong>. No cubre todas las plataformas IA ni puede determinar autenticidad solo por píxeles.',
    'signals.title':         'Tipos de señales compatibles',
    'formats.title':         'Formatos compatibles',
    'results.title':         'Resultados de detección',
    'results.subtitle':      'Los resultados listan señales coincidentes, niveles de confianza, detalles de campo y limitaciones.',
    'results.empty':         'Prueba con una imagen original. Cuanto menos procesada, más señales detectables conserva.',
    'skeleton':              'Cargando…',
    'status.ready':          'Listo para analizar.',
    'status.error':          'Error de inicialización. Por favor actualiza.',
    'status.no_file':        'No se ha seleccionado ningún archivo.',
    'status.selected':       'Seleccionado: ',
    'status.analyzing':      'Analizando archivo localmente…',
    'status.done':           'Análisis completo.',
    'status.unsupported':    'Selecciona una imagen o video compatible.',
    'btn.idle':              'Analizar',
    'btn.running':           'Analizando…',
    'report.ai_yes':         'Señales de origen IA detectadas',
    'report.ai_no':          'No se encontraron señales de origen IA conocidas',
    'report.no_signals':     'No se detectaron señales de origen IA conocidas. Nota: esto no significa que el archivo no sea generado por IA.',
    'report.no_limitations': 'Sin limitaciones adicionales.',
    'report.label.filename': 'Nombre de archivo',
    'report.label.mime':     'Tipo MIME',
    'report.label.media_type':'Tipo de medio',
    'report.label.mode':     'Modo',
    'report.label.signals':  'Cantidad de señales',
    'report.heading.signals':'Señales coincidentes',
    'report.heading.limits': 'Limitaciones y notas de riesgo',
  },

  // ── Portuguese (Brazil) ──────────────────────────────────────────
  'pt-BR': {
    'nav.tool':         'Detector',
    'nav.platforms':    'Guias de Plataformas',
    'nav.blog':         'Blog',
    'nav.about':        'Sobre',
    'nav.privacy':      'Privacidade',
    'nav.terms':        'Termos',
    'nav.contact':      'Contato',
    'footer.note':      `© ${new Date().getFullYear()} AICheck365 · Imagens e vídeos são analisados localmente no seu navegador`,
    'page.title':       'AICheck365 · Detector de IA para imagens/vídeos | Identificar mídia gerada por IA de graça',
    'page.description': 'Verifique indícios de origem por IA em imagens e vídeos diretamente no navegador. Lê EXIF, XMP, C2PA, texto PNG, metadados MP4/MOV e marcas dágua de quadros. Sem uploads.',
    'eyebrow':               'Detecção de origem IA para imagens/vídeos',
    'hero.h1':               'Detector de origem de imagens/vídeos IA',
    'hero.lead':             'Imagens e vídeos são analisados <strong>localmente no seu navegador — sem uploads para o servidor</strong>. Detecta metadados, rastros de plataformas, nomes de arquivo e marcas dágua de quadros.',
    'metric.uploads.value':  '0',
    'metric.uploads.label':  'Uploads para servidor',
    'metric.local.value':    '100%',
    'metric.local.label':    'Processamento local',
    'trust.privacy':         'Privacidade em primeiro lugar',
    'trust.privacy.desc':    'Arquivos são lidos apenas dentro do seu navegador',
    'trust.original':        'Melhor com originais',
    'trust.original.desc':   'Arquivos não modificados retêm mais sinais detectáveis',
    'trust.explain':         'Resultados explicáveis',
    'trust.explain.desc':    'Mostra fonte do sinal, confiança e detalhes do campo',
    'notice':                '<strong>Importante:</strong> Não é um detector de IA universal. Usa apenas sinais EXIF / XMP / blocos de texto PNG / nome de arquivo como indicadores suplementares. Se a imagem foi comprimida por redes sociais, capturada em screenshot, re-exportada ou teve metadados removidos, a maioria dos sinais desaparecerá.',
    'upload.title':          'Enviar imagem/vídeo',
    'upload.subtitle':       'Selecione uma imagem ou vídeo e clique em Analisar. Todo o processamento ocorre localmente.',
    'upload.zone.title':     'Clique ou arraste uma imagem/vídeo aqui',
    'upload.zone.formats':   'JPEG / PNG / WebP / GIF / BMP / TIFF / MP4 / MOV / M4V / WebM / AVI suportados',
    'upload.button':         'Analisar',
    'upload.status.init':    'Inicializando…',
    'platforms.title':       'Plataformas / Ferramentas detectáveis',
    'platforms.desc':        'Representa apenas o <strong>alcance dos padrões de rastro atualmente detectáveis</strong>. Não cobre todas as plataformas de IA e não pode determinar autenticidade apenas por pixels.',
    'signals.title':         'Tipos de sinais suportados',
    'formats.title':         'Formatos suportados',
    'results.title':         'Resultados de detecção',
    'results.subtitle':      'Os resultados listam sinais correspondentes, níveis de confiança, detalhes de campo e limitações.',
    'results.empty':         'Tente com uma imagem original. Quanto menos processada, mais sinais detectáveis ela retém.',
    'skeleton':              'Carregando…',
    'status.ready':          'Pronto para analisar.',
    'status.error':          'Falha na inicialização. Por favor atualize a página.',
    'status.no_file':        'Nenhum arquivo selecionado.',
    'status.selected':       'Selecionado: ',
    'status.analyzing':      'Analisando arquivo localmente…',
    'status.done':           'Análise concluída.',
    'status.unsupported':    'Selecione uma imagem ou vídeo compatível.',
    'btn.idle':              'Analisar',
    'btn.running':           'Analisando…',
    'report.ai_yes':         'Sinais de origem IA detectados',
    'report.ai_no':          'Nenhum sinal de origem IA conhecido encontrado',
    'report.no_signals':     'Nenhum sinal de origem IA conhecido detectado. Nota: isso não significa que o arquivo não seja gerado por IA.',
    'report.no_limitations': 'Sem limitações adicionais.',
    'report.label.filename': 'Nome do arquivo',
    'report.label.mime':     'Tipo MIME',
    'report.label.media_type':'Tipo de mídia',
    'report.label.mode':     'Modo',
    'report.label.signals':  'Contagem de sinais',
    'report.heading.signals':'Sinais correspondentes',
    'report.heading.limits': 'Limitações e notas de risco',
  },
};

// ─── OG locale map ───────────────────────────────────────────────
const OG_LOCALE = {
  'zh-CN': 'zh_CN', 'zh-TW': 'zh_TW', 'en': 'en_US',
  'ja': 'ja_JP', 'ko': 'ko_KR', 'de': 'de_DE',
  'fr': 'fr_FR', 'es': 'es_ES', 'pt-BR': 'pt_BR',
};

const SUPPORTED_LANGS = Object.keys(translations);

function langFromPathname(pathname = window.location.pathname) {
  const segment = pathname.split('/').filter(Boolean)[0];
  return SUPPORTED_LANGS.includes(segment) ? segment : null;
}

function stripLangFromPathname(pathname = window.location.pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && SUPPORTED_LANGS.includes(parts[0])) parts.shift();
  return parts.length ? `/${parts.join('/')}/` : '/';
}

function withLangInPathname(pathname, lang) {
  const cleanPath = stripLangFromPathname(pathname);
  if (lang === 'zh-CN') {
    return cleanPath;
  }
  return cleanPath === '/' ? `/${lang}/` : `/${lang}${cleanPath}`;
}

// ─── Language detection ──────────────────────────────────────────
function detectLang() {
  const urlLang = langFromPathname();
  if (urlLang) return urlLang;

  // 如果 URL 里没有语言前缀，说明访问的是主站默认的简体中文页面
  // 必须强制返回默认语言 'zh-CN'，防止客户端 JS 将无前缀的根目录页面改写为其他语言而导致 Googlebot 报重定向或内容不一致错误
  return 'zh-CN';
}

let currentLang = detectLang();

// ─── Public API ──────────────────────────────────────────────────
export function t(key) {
  return translations[currentLang]?.[key]
    ?? translations['en']?.[key]
    ?? translations['zh-CN']?.[key]
    ?? key;
}

export function getCurrentLang() { return currentLang; }

export function getSupportedLangs() { return SUPPORTED_LANGS; }

export function setLang(lang, options = {}) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);

  if (options.navigate !== false) {
    const nextPath = withLangInPathname(window.location.pathname, lang);
    const nextUrl = `${nextPath}${window.location.search}${window.location.hash}`;
    if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.location.assign(nextUrl);
      return;
    }
  }

  applyI18n();
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function applyI18n() {
  const urlLang = langFromPathname();
  if (urlLang && urlLang !== currentLang) {
    currentLang = urlLang;
    localStorage.setItem('lang', urlLang);
  }

  document.documentElement.lang = currentLang;

  if (document.body?.dataset.i18nPage === 'home') {
    document.title = t('page.title');
    document.querySelector('meta[name="description"]')
      ?.setAttribute('content', t('page.description'));
    document.querySelector('meta[property="og:title"]')
      ?.setAttribute('content', t('page.title'));
    document.querySelector('meta[property="og:description"]')
      ?.setAttribute('content', t('page.description'));
  }

  document.querySelector('meta[property="og:locale"]')
    ?.setAttribute('content', OG_LOCALE[currentLang] || 'en_US');

  // text content
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  // html content
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  // sync language selector
  const sel = document.getElementById('lang-switch');
  if (sel) sel.value = currentLang;

  localizeInternalLinks();
}

function localizeInternalLinks() {
  const urlLang = langFromPathname();
  if (!urlLang) return;

  document.querySelectorAll('a[href^="/"]').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('//')) return;
    const url = new URL(href, window.location.origin);
    anchor.setAttribute('href', `${withLangInPathname(url.pathname, urlLang)}${url.search}${url.hash}`);
  });
}

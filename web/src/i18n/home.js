// ─── Home-page marketing strings (server-rendered) ───────────────────────────
//
// Single source of truth for the static copy in the homepage building blocks
// (FileAnatomy, EvidenceVanish, FiveLayer, PlatformFingerprint, MethodologyBlock,
// SampleExperience, LatestExperiments). These render at build time per language
// route, so the page is correct with JavaScript disabled.
//
// Brand names (OpenAI, Midjourney, …) and the illustrative technical field
// listings inside FiveLayer / FileAnatomy are intentionally NOT translated —
// they are language-neutral examples of real metadata fields.
//
// English + Simplified Chinese are the canonical reference; the other seven
// languages were translated and independently reviewed against that canon.
// `homeStrings(lang)` falls back to English for any unknown language.

const HOME_I18N = {
  "en": {
    "anatomy": { "caption": "AICheck365 inspects the inside of the file, instead of guessing from the picture." },
    "platforms": { "title": "Researched Platforms", "subtitle": "Dedicated detection guides exist for the platforms below. Click to see common origin signals." },
    "vanish": {
      "title": "Why evidence disappears",
      "subtitle": "Each share, compression, or screenshot may erase AI-origin signals.",
      "badgeIntact": "Intact", "badgeLost": "Lost",
      "emphasis": "No signals found does not mean it is not AI-generated. Evidence may have been erased during sharing.",
      "steps": [
        { "title": "Original platform file", "detail": "All metadata intact: C2PA, XMP, EXIF, PNG text chunks, generation params" },
        { "title": "Chat app transfer (WeChat / Telegram)", "detail": "Lost: PNG text chunks, most XMP fields, EXIF GPS data" },
        { "title": "Social platform transcode (Weibo / Twitter / Instagram)", "detail": "Lost: All EXIF fields, C2PA Manifest, XMP CreatorTool, all generation params" },
        { "title": "Screenshot or screen recording", "detail": "Lost: All original metadata; only screenshot tool EXIF remains" },
        { "title": "Re-export / save-as", "detail": "Lost: All provenance fields; new software may write unrelated EXIF" }
      ]
    },
    "fiveLayer": {
      "title": "Five evidence layers",
      "subtitle": "Click each layer to see example fields that are inspected.",
      "layerTitles": ["File type / Basics", "EXIF + XMP metadata", "PNG text chunks + generation params", "C2PA + digital signature", "Video container + SEI + frames"]
    },
    "methodology": {
      "section": "Methodology & Limitations", "can": "We can check", "cannot": "We cannot guarantee",
      "slogan": "Evidence beats intuition. Transparency beats percentages.", "link": "Read the full methodology",
      "canList": ["File metadata (EXIF / XMP / IPTC)", "Provenance credentials (C2PA / Content Credentials)", "Digital signatures and hashes", "Platform marks and generation parameters", "Container structure and file headers", "Some edit and export clues", "PNG text chunks", "MP4/MOV container metadata and SEI markers"],
      "cannotList": ["All AI files retain provenance data", "Screenshots retain origin information", "All platforms use uniform marks", "No signal means human-made", "Results replace legal or expert appraisal"]
    },
    "sample": { "title": "Real Sample Experience", "subtitle": "These samples come from real tests. Click to analyze in the detector.", "soon": "Real samples coming soon", "processed": "Processed", "signals": "signals", "source": "Source", "limits": "Known limits", "unprocessed": "Unprocessed" },
    "experiments": { "title": "Latest Experiments", "subtitle": "Real batch test results.", "soon": "Latest experiment records coming soon", "samples": "samples", "changed": "Result changed", "detail": "View details", "parser": "Parser" }
  },
  "zh-CN": {
    "anatomy": { "caption": "AICheck365 查看文件内部，而不是凭画面猜测。" },
    "platforms": { "title": "支持研究的平台", "subtitle": "以下平台已有专项检测指南，点击查看各平台的常见来源线索。" },
    "vanish": {
      "title": "证据为什么会消失？", "subtitle": "每次转发、压缩、截图，都可能抹去 AI 来源线索。",
      "badgeIntact": "完整", "badgeLost": "已丢失",
      "emphasis": "没有找到证据，不代表它不是 AI。证据可能已经在传播过程中消失。",
      "steps": [
        { "title": "原始平台文件", "detail": "保留全部元数据：C2PA、XMP、EXIF、PNG 文本块、生成参数" },
        { "title": "聊天 App 转发（微信 / Telegram）", "detail": "丢失：PNG 文本块、XMP 大部分字段、EXIF GPS 信息" },
        { "title": "社交平台转码（微博 / Twitter / Instagram）", "detail": "丢失：EXIF 全部字段、C2PA Manifest、XMP CreatorTool、所有生成参数" },
        { "title": "截图或录屏", "detail": "丢失：所有原始元数据，仅保留截图软件写入的新 EXIF" },
        { "title": "重新导出 / 另存为", "detail": "丢失：所有溯源字段，可能被新软件写入无关 EXIF" }
      ]
    },
    "fiveLayer": {
      "title": "AICheck365 检查哪五层？", "subtitle": "点击每一层，查看实际检测的字段示例。",
      "layerTitles": ["文件类型 / 基础信息", "EXIF + XMP 元数据", "PNG 文本块 + 生成参数", "C2PA + 数字签名", "视频容器 + SEI + 帧"]
    },
    "methodology": {
      "section": "方法论与检测限制", "can": "可检查", "cannot": "不能保证",
      "slogan": "证据比感觉重要。透明比百分比重要。", "link": "了解完整方法论",
      "canList": ["文件元数据（EXIF / XMP / IPTC）", "来源凭证（C2PA / Content Credentials）", "数字签名与哈希", "平台标记与生成参数", "容器结构与文件头", "部分编辑/导出线索", "PNG 文本块", "MP4/MOV 容器元数据与 SEI 标记"],
      "cannotList": ["所有 AI 文件都保留了来源信息", "截图保留了原始出处", "所有平台使用统一的标记格式", "无信号 = 人工制作", "结果可替代法律鉴定或专家评估"]
    },
    "sample": { "title": "真实样本体验", "subtitle": "以下样本来自真实测试，点击可在检测器中分析。", "soon": "真实样本即将上线", "processed": "经过处理", "signals": "信号", "source": "来源", "limits": "已知限制", "unprocessed": "未处理" },
    "experiments": { "title": "最新实验记录", "subtitle": "以下为真实批量测试结果。", "soon": "最新实验记录即将发布", "samples": "个样本", "changed": "结果有变化", "detail": "查看详情", "parser": "解析器" }
  },
  "zh-TW": {
    "anatomy": { "caption": "AICheck365 檢查檔案內部，而不是憑畫面猜測。" },
    "platforms": { "title": "已研究的平台", "subtitle": "以下平台已有專項偵測指南，點擊查看各平台的常見來源訊號。" },
    "vanish": {
      "title": "證據為什麼會消失？", "subtitle": "每次轉發、壓縮、截圖，都可能抹去 AI 來源訊號。",
      "badgeIntact": "完整", "badgeLost": "已遺失",
      "emphasis": "未找到訊號，不代表它不是 AI 生成。證據可能已在傳播過程中被抹去。",
      "steps": [
        { "title": "原始平台檔案", "detail": "保留全部元數據：C2PA、XMP、EXIF、PNG 文字區塊、生成參數" },
        { "title": "通訊軟體轉發（WeChat / Telegram）", "detail": "遺失：PNG 文字區塊、XMP 大部分欄位、EXIF GPS 資訊" },
        { "title": "社群平台轉碼（Weibo / Twitter / Instagram）", "detail": "遺失：EXIF 全部欄位、C2PA Manifest、XMP CreatorTool、所有生成參數" },
        { "title": "截圖或螢幕錄影", "detail": "遺失：所有原始元數據，僅保留截圖軟體寫入的 EXIF" },
        { "title": "重新匯出 / 另存新檔", "detail": "遺失：所有溯源欄位，可能被新軟體寫入無關的 EXIF" }
      ]
    },
    "fiveLayer": {
      "title": "五個證據層", "subtitle": "點擊每一層，查看實際檢查的欄位範例。",
      "layerTitles": ["檔案類型 / 基礎資訊", "EXIF + XMP 元數據", "PNG 文字區塊 + 生成參數", "C2PA + 數位簽名", "影片容器 + SEI + 影格"]
    },
    "methodology": {
      "section": "方法論與偵測限制", "can": "我們可以檢查", "cannot": "我們無法保證",
      "slogan": "證據勝於直覺。透明勝於百分比。", "link": "閱讀完整方法論",
      "canList": ["檔案元數據（EXIF / XMP / IPTC）", "來源憑證（C2PA / Content Credentials）", "數位簽名與雜湊值", "平台標記與生成參數", "容器結構與檔案標頭", "部分編輯與匯出線索", "PNG 文字區塊", "MP4/MOV 容器元數據與 SEI 標記"],
      "cannotList": ["所有 AI 檔案都保留了來源資料", "截圖保留了原始出處資訊", "所有平台使用統一的標記", "無訊號就代表是人類製作", "結果可取代法律鑑定或專家評估"]
    },
    "sample": { "title": "真實樣本體驗", "subtitle": "以下樣本來自真實測試，點擊可在偵測器中分析。", "soon": "真實樣本即將上線", "processed": "已處理", "signals": "個訊號", "source": "來源", "limits": "已知限制", "unprocessed": "未處理" },
    "experiments": { "title": "最新實驗記錄", "subtitle": "以下為真實批次測試結果。", "soon": "最新實驗記錄即將發布", "samples": "個樣本", "changed": "結果有變化", "detail": "查看詳情", "parser": "解析器" }
  },
  "ja": {
    "anatomy": { "caption": "AICheck365 は画面から推測するのではなく、ファイルの内部を検査します。" },
    "platforms": { "title": "調査済みプラットフォーム", "subtitle": "以下のプラットフォームには専用の検出ガイドがあります。クリックすると一般的な出所シグナルを確認できます。" },
    "vanish": {
      "title": "なぜ証拠は消えるのか", "subtitle": "共有・圧縮・スクリーンショットのたびに、AI由来のシグナルが消える可能性があります。",
      "badgeIntact": "保持", "badgeLost": "消失",
      "emphasis": "シグナルが見つからないことは、AI生成でないことを意味しません。証拠は共有の過程で消えてしまった可能性があります。",
      "steps": [
        { "title": "プラットフォームのオリジナルファイル", "detail": "すべてのメタデータが保持：C2PA、XMP、EXIF、PNGテキストチャンク、生成パラメータ" },
        { "title": "チャットアプリでの転送（WeChat / Telegram）", "detail": "消失：PNGテキストチャンク、XMPの大部分のフィールド、EXIFのGPSデータ" },
        { "title": "SNSプラットフォームでのトランスコード（Weibo / Twitter / Instagram）", "detail": "消失：EXIF全フィールド、C2PA マニフェスト、XMP CreatorTool、すべての生成パラメータ" },
        { "title": "スクリーンショットまたは画面録画", "detail": "消失：すべての元のメタデータ。スクリーンショットツールのEXIFのみ残ります" },
        { "title": "再エクスポート / 別名で保存", "detail": "消失：すべての出所フィールド。新しいソフトウェアが無関係なEXIFを書き込む場合があります" }
      ]
    },
    "fiveLayer": {
      "title": "5つの証拠レイヤー", "subtitle": "各レイヤーをクリックすると、検査されるフィールドの例を確認できます。",
      "layerTitles": ["ファイルタイプ / 基本情報", "EXIF + XMP メタデータ", "PNGテキストチャンク + 生成パラメータ", "C2PA + デジタル署名", "動画コンテナ + SEI + フレーム"]
    },
    "methodology": {
      "section": "方法論と制限事項", "can": "確認できること", "cannot": "保証できないこと",
      "slogan": "証拠は直感に勝る。透明性はパーセンテージに勝る。", "link": "完全な方法論を読む",
      "canList": ["ファイルメタデータ（EXIF / XMP / IPTC）", "出所資格情報（C2PA / Content Credentials）", "デジタル署名とハッシュ", "プラットフォームのマークと生成パラメータ", "コンテナ構造とファイルヘッダー", "一部の編集・エクスポートの手がかり", "PNGテキストチャンク", "MP4/MOV コンテナメタデータと SEI マーカー"],
      "cannotList": ["すべてのAIファイルが出所データを保持している", "スクリーンショットが出所情報を保持している", "すべてのプラットフォームが統一されたマークを使用している", "シグナルがない＝人間が作成した", "結果が法的鑑定や専門家の評価に代わる"]
    },
    "sample": { "title": "実サンプル体験", "subtitle": "これらのサンプルは実際のテストから得られたものです。クリックすると検出ツールで分析できます。", "soon": "実サンプル近日公開", "processed": "処理済み", "signals": "シグナル", "source": "出所", "limits": "既知の制限", "unprocessed": "未処理" },
    "experiments": { "title": "最新の実験記録", "subtitle": "実際のバッチテスト結果です。", "soon": "最新の実験記録近日公開", "samples": "サンプル", "changed": "結果に変化あり", "detail": "詳細を見る", "parser": "パーサー" }
  },
  "ko": {
    "anatomy": { "caption": "AICheck365는 화면을 보고 추측하는 대신, 파일 내부를 들여다봅니다." },
    "platforms": { "title": "연구된 플랫폼", "subtitle": "아래 플랫폼에는 전용 감지 가이드가 있습니다. 클릭하면 각 플랫폼의 일반적인 출처 신호를 확인할 수 있습니다." },
    "vanish": {
      "title": "증거가 사라지는 이유", "subtitle": "공유, 압축, 스크린샷을 거칠 때마다 AI 출처 신호가 지워질 수 있습니다.",
      "badgeIntact": "온전함", "badgeLost": "손실됨",
      "emphasis": "신호가 발견되지 않았다고 해서 AI 생성이 아니라는 뜻은 아닙니다. 증거는 전파 과정에서 이미 지워졌을 수 있습니다.",
      "steps": [
        { "title": "원본 플랫폼 파일", "detail": "모든 메타데이터 온전함: C2PA, XMP, EXIF, PNG 텍스트 청크, 생성 파라미터" },
        { "title": "채팅 앱 전송 (WeChat / Telegram)", "detail": "손실: PNG 텍스트 청크, 대부분의 XMP 필드, EXIF GPS 데이터" },
        { "title": "소셜 플랫폼 트랜스코딩 (Weibo / Twitter / Instagram)", "detail": "손실: 모든 EXIF 필드, C2PA Manifest, XMP CreatorTool, 모든 생성 파라미터" },
        { "title": "스크린샷 또는 화면 녹화", "detail": "손실: 모든 원본 메타데이터; 스크린샷 도구의 EXIF만 남음" },
        { "title": "재내보내기 / 다른 이름으로 저장", "detail": "손실: 모든 출처 필드; 새 소프트웨어가 무관한 EXIF를 기록할 수 있음" }
      ]
    },
    "fiveLayer": {
      "title": "다섯 가지 증거 레이어", "subtitle": "각 레이어를 클릭하면 검사되는 필드 예시를 확인할 수 있습니다.",
      "layerTitles": ["파일 유형 / 기본 정보", "EXIF + XMP 메타데이터", "PNG 텍스트 청크 + 생성 파라미터", "C2PA + 디지털 서명", "동영상 컨테이너 + SEI + 프레임"]
    },
    "methodology": {
      "section": "방법론과 한계", "can": "확인할 수 있는 것", "cannot": "보장할 수 없는 것",
      "slogan": "증거는 직감을 이깁니다. 투명성은 백분율을 이깁니다.", "link": "전체 방법론 읽기",
      "canList": ["파일 메타데이터 (EXIF / XMP / IPTC)", "출처 자격증명 (C2PA / Content Credentials)", "디지털 서명과 해시", "플랫폼 마커와 생성 파라미터", "컨테이너 구조와 파일 헤더", "일부 편집 및 내보내기 단서", "PNG 텍스트 청크", "MP4/MOV 컨테이너 메타데이터와 SEI 마커"],
      "cannotList": ["모든 AI 파일이 출처 데이터를 보존한다", "스크린샷이 원본 출처 정보를 보존한다", "모든 플랫폼이 통일된 마커를 사용한다", "신호가 없으면 사람이 만든 것이다", "결과가 법적 감정이나 전문가 평가를 대체한다"]
    },
    "sample": { "title": "실제 샘플 체험", "subtitle": "이 샘플들은 실제 테스트에서 가져온 것입니다. 클릭하면 감지기에서 분석할 수 있습니다.", "soon": "실제 샘플 곧 출시 예정", "processed": "처리됨", "signals": "신호", "source": "출처", "limits": "알려진 한계", "unprocessed": "미처리" },
    "experiments": { "title": "최신 실험 기록", "subtitle": "실제 배치 테스트 결과입니다.", "soon": "최신 실험 기록 곧 공개 예정", "samples": "개 샘플", "changed": "결과 변경됨", "detail": "상세 보기", "parser": "파서" }
  },
  "de": {
    "anatomy": { "caption": "AICheck365 prüft das Innere der Datei, statt anhand des Bildes zu raten." },
    "platforms": { "title": "Untersuchte Plattformen", "subtitle": "Für die folgenden Plattformen gibt es eigene Erkennungs-Guides. Klicken Sie, um typische Herkunftssignale zu sehen." },
    "vanish": {
      "title": "Warum Beweise verschwinden", "subtitle": "Jedes Teilen, jede Kompression oder jeder Screenshot kann KI-Herkunftssignale auslöschen.",
      "badgeIntact": "Intakt", "badgeLost": "Verloren",
      "emphasis": "Keine gefundenen Signale bedeuten nicht, dass die Datei nicht KI-generiert ist. Die Beweise wurden möglicherweise beim Teilen ausgelöscht.",
      "steps": [
        { "title": "Originaldatei der Plattform", "detail": "Alle Metadaten intakt: C2PA, XMP, EXIF, PNG-Text-Chunks, Generierungsparameter" },
        { "title": "Übertragung per Chat-App (WeChat / Telegram)", "detail": "Verloren: PNG-Text-Chunks, die meisten XMP-Felder, EXIF-GPS-Daten" },
        { "title": "Transcoding durch soziale Plattform (Weibo / Twitter / Instagram)", "detail": "Verloren: alle EXIF-Felder, C2PA-Manifest, XMP CreatorTool, alle Generierungsparameter" },
        { "title": "Screenshot oder Bildschirmaufnahme", "detail": "Verloren: alle Original-Metadaten; nur das EXIF des Screenshot-Tools bleibt erhalten" },
        { "title": "Re-Export / Speichern unter", "detail": "Verloren: alle Herkunftsfelder; neue Software schreibt möglicherweise unzusammenhängende EXIF-Daten" }
      ]
    },
    "fiveLayer": {
      "title": "Fünf Beweisebenen", "subtitle": "Klicken Sie auf jede Ebene, um Beispielfelder zu sehen, die geprüft werden.",
      "layerTitles": ["Dateityp / Grundlagen", "EXIF- + XMP-Metadaten", "PNG-Text-Chunks + Generierungsparameter", "C2PA + digitale Signatur", "Video-Container + SEI + Frames"]
    },
    "methodology": {
      "section": "Methodik & Einschränkungen", "can": "Wir können prüfen", "cannot": "Wir können nicht garantieren",
      "slogan": "Beweise schlagen Intuition. Transparenz schlägt Prozentzahlen.", "link": "Vollständige Methodik lesen",
      "canList": ["Datei-Metadaten (EXIF / XMP / IPTC)", "Herkunftsnachweise (C2PA / Content Credentials)", "Digitale Signaturen und Hashes", "Plattform-Markierungen und Generierungsparameter", "Container-Struktur und Datei-Header", "Einige Bearbeitungs- und Export-Hinweise", "PNG-Text-Chunks", "MP4/MOV-Container-Metadaten und SEI-Markierungen"],
      "cannotList": ["Dass alle KI-Dateien Herkunftsdaten behalten", "Dass Screenshots Herkunftsinformationen behalten", "Dass alle Plattformen einheitliche Markierungen verwenden", "Dass fehlende Signale bedeuten, dass etwas von Menschenhand stammt", "Dass die Ergebnisse eine rechtliche oder fachliche Begutachtung ersetzen"]
    },
    "sample": { "title": "Erfahrung mit echten Beispielen", "subtitle": "Diese Beispiele stammen aus echten Tests. Klicken Sie, um sie im Detektor zu analysieren.", "soon": "Echte Beispiele bald verfügbar", "processed": "Verarbeitet", "signals": "Signale", "source": "Quelle", "limits": "Bekannte Einschränkungen", "unprocessed": "Unverarbeitet" },
    "experiments": { "title": "Neueste Experimente", "subtitle": "Echte Batch-Testergebnisse.", "soon": "Neueste Experiment-Aufzeichnungen bald verfügbar", "samples": "Beispiele", "changed": "Ergebnis geändert", "detail": "Details ansehen", "parser": "Parser" }
  },
  "fr": {
    "anatomy": { "caption": "AICheck365 inspecte l'intérieur du fichier, au lieu de deviner à partir de l'image." },
    "platforms": { "title": "Plateformes étudiées", "subtitle": "Des guides de détection dédiés existent pour les plateformes ci-dessous. Cliquez pour voir les signaux d'origine courants." },
    "vanish": {
      "title": "Pourquoi les preuves disparaissent", "subtitle": "Chaque partage, compression ou capture d'écran peut effacer les signaux d'origine IA.",
      "badgeIntact": "Intact", "badgeLost": "Perdu",
      "emphasis": "L'absence de signal ne signifie pas que ce n'est pas généré par IA. Les preuves ont pu être effacées lors du partage.",
      "steps": [
        { "title": "Fichier original de la plateforme", "detail": "Toutes les métadonnées intactes : C2PA, XMP, EXIF, texte PNG, paramètres de génération" },
        { "title": "Transfert via application de messagerie (WeChat / Telegram)", "detail": "Perdus : texte PNG, la plupart des champs XMP, données GPS EXIF" },
        { "title": "Transcodage par plateforme sociale (Weibo / Twitter / Instagram)", "detail": "Perdus : tous les champs EXIF, le Manifest C2PA, le CreatorTool XMP, tous les paramètres de génération" },
        { "title": "Capture d'écran ou enregistrement d'écran", "detail": "Perdues : toutes les métadonnées originales ; seuls les EXIF de l'outil de capture subsistent" },
        { "title": "Ré-exportation / enregistrement sous", "detail": "Perdus : tous les champs de provenance ; un nouveau logiciel peut écrire des EXIF sans rapport" }
      ]
    },
    "fiveLayer": {
      "title": "Cinq couches de preuves", "subtitle": "Cliquez sur chaque couche pour voir des exemples de champs inspectés.",
      "layerTitles": ["Type de fichier / Informations de base", "Métadonnées EXIF + XMP", "Texte PNG + paramètres de génération", "C2PA + signature numérique", "Conteneur vidéo + SEI + trames"]
    },
    "methodology": {
      "section": "Méthodologie et limites", "can": "Ce que nous pouvons vérifier", "cannot": "Ce que nous ne pouvons pas garantir",
      "slogan": "Les preuves valent mieux que l'intuition. La transparence vaut mieux que les pourcentages.", "link": "Lire la méthodologie complète",
      "canList": ["Métadonnées de fichier (EXIF / XMP / IPTC)", "Références de provenance (C2PA / Content Credentials)", "Signatures numériques et hachages", "Marques de plateforme et paramètres de génération", "Structure du conteneur et en-têtes de fichier", "Certains indices de modification et d'exportation", "Texte PNG", "Métadonnées de conteneur MP4/MOV et marqueurs SEI"],
      "cannotList": ["Tous les fichiers IA conservent des données de provenance", "Les captures d'écran conservent les informations d'origine", "Toutes les plateformes utilisent des marques uniformes", "L'absence de signal signifie une création humaine", "Les résultats remplacent une expertise juridique ou professionnelle"]
    },
    "sample": { "title": "Expérience sur échantillons réels", "subtitle": "Ces échantillons proviennent de tests réels. Cliquez pour les analyser dans le détecteur.", "soon": "Échantillons réels bientôt disponibles", "processed": "Traité", "signals": "signaux", "source": "Source", "limits": "Limites connues", "unprocessed": "Non traité" },
    "experiments": { "title": "Dernières expériences", "subtitle": "Résultats de tests par lots réels.", "soon": "Derniers comptes rendus d'expériences bientôt disponibles", "samples": "échantillons", "changed": "Résultat modifié", "detail": "Voir les détails", "parser": "Analyseur" }
  },
  "es": {
    "anatomy": { "caption": "AICheck365 inspecciona el interior del archivo, en lugar de adivinar a partir de la imagen." },
    "platforms": { "title": "Plataformas investigadas", "subtitle": "Existen guías de detección dedicadas para las plataformas siguientes. Haz clic para ver las señales de origen más comunes." },
    "vanish": {
      "title": "Por qué desaparece la evidencia", "subtitle": "Cada vez que se comparte, comprime o captura en pantalla, pueden borrarse las señales de origen IA.",
      "badgeIntact": "Intacto", "badgeLost": "Perdido",
      "emphasis": "No encontrar señales no significa que no sea generado por IA. La evidencia puede haberse borrado durante la propagación.",
      "steps": [
        { "title": "Archivo original de la plataforma", "detail": "Todos los metadatos intactos: C2PA, XMP, EXIF, bloques de texto PNG, parámetros de generación" },
        { "title": "Transferencia por app de mensajería (WeChat / Telegram)", "detail": "Perdido: bloques de texto PNG, la mayoría de los campos XMP, datos GPS de EXIF" },
        { "title": "Transcodificación de plataforma social (Weibo / Twitter / Instagram)", "detail": "Perdido: todos los campos EXIF, el Manifiesto C2PA, XMP CreatorTool, todos los parámetros de generación" },
        { "title": "Captura de pantalla o grabación de pantalla", "detail": "Perdido: todos los metadatos originales; solo permanece el EXIF de la herramienta de captura" },
        { "title": "Reexportación / guardar como", "detail": "Perdido: todos los campos de procedencia; el nuevo software puede escribir EXIF no relacionado" }
      ]
    },
    "fiveLayer": {
      "title": "Cinco capas de evidencia", "subtitle": "Haz clic en cada capa para ver ejemplos de campos que se inspeccionan.",
      "layerTitles": ["Tipo de archivo / Información básica", "Metadatos EXIF + XMP", "Bloques de texto PNG + parámetros de generación", "C2PA + firma digital", "Contenedor de video + SEI + fotogramas"]
    },
    "methodology": {
      "section": "Metodología y limitaciones", "can": "Podemos comprobar", "cannot": "No podemos garantizar",
      "slogan": "La evidencia supera a la intuición. La transparencia supera a los porcentajes.", "link": "Leer la metodología completa",
      "canList": ["Metadatos del archivo (EXIF / XMP / IPTC)", "Credenciales de procedencia (C2PA / Content Credentials)", "Firmas digitales y hashes", "Marcas de plataforma y parámetros de generación", "Estructura del contenedor y encabezados de archivo", "Algunas pistas de edición y exportación", "Bloques de texto PNG", "Metadatos del contenedor MP4/MOV y marcadores SEI"],
      "cannotList": ["Que todos los archivos de IA conserven datos de procedencia", "Que las capturas de pantalla conserven información de origen", "Que todas las plataformas usen marcas uniformes", "Que la ausencia de señal signifique creación humana", "Que los resultados sustituyan un peritaje legal o experto"]
    },
    "sample": { "title": "Experiencia con muestras reales", "subtitle": "Estas muestras provienen de pruebas reales. Haz clic para analizarlas en el detector.", "soon": "Muestras reales próximamente", "processed": "Procesado", "signals": "señales", "source": "Fuente", "limits": "Limitaciones conocidas", "unprocessed": "Sin procesar" },
    "experiments": { "title": "Últimos experimentos", "subtitle": "Resultados reales de pruebas por lotes.", "soon": "Registros de los últimos experimentos próximamente", "samples": "muestras", "changed": "El resultado cambió", "detail": "Ver detalles", "parser": "Analizador" }
  },
  "pt-BR": {
    "anatomy": { "caption": "O AICheck365 inspeciona o interior do arquivo, em vez de adivinhar pela imagem." },
    "platforms": { "title": "Plataformas pesquisadas", "subtitle": "Existem guias de detecção dedicados para as plataformas abaixo. Clique para ver os sinais de origem comuns." },
    "vanish": {
      "title": "Por que as evidências desaparecem", "subtitle": "Cada compartilhamento, compressão ou captura de tela pode apagar os sinais de origem por IA.",
      "badgeIntact": "Intacto", "badgeLost": "Perdido",
      "emphasis": "Não encontrar sinais não significa que não seja gerado por IA. As evidências podem ter sido apagadas durante o compartilhamento.",
      "steps": [
        { "title": "Arquivo original da plataforma", "detail": "Todos os metadados intactos: C2PA, XMP, EXIF, blocos de texto PNG, parâmetros de geração" },
        { "title": "Transferência por app de mensagens (WeChat / Telegram)", "detail": "Perdidos: blocos de texto PNG, maioria dos campos XMP, dados de GPS do EXIF" },
        { "title": "Transcodificação por plataforma social (Weibo / Twitter / Instagram)", "detail": "Perdidos: todos os campos EXIF, C2PA Manifest, XMP CreatorTool, todos os parâmetros de geração" },
        { "title": "Captura de tela ou gravação de tela", "detail": "Perdidos: todos os metadados originais; resta apenas o EXIF da ferramenta de captura" },
        { "title": "Reexportação / salvar como", "detail": "Perdidos: todos os campos de proveniência; um novo software pode gravar EXIF não relacionado" }
      ]
    },
    "fiveLayer": {
      "title": "Cinco camadas de evidência", "subtitle": "Clique em cada camada para ver exemplos de campos que são inspecionados.",
      "layerTitles": ["Tipo de arquivo / Informações básicas", "Metadados EXIF + XMP", "Blocos de texto PNG + parâmetros de geração", "C2PA + assinatura digital", "Contêiner de vídeo + SEI + quadros"]
    },
    "methodology": {
      "section": "Metodologia e limitações", "can": "Podemos verificar", "cannot": "Não podemos garantir",
      "slogan": "Evidências superam a intuição. Transparência supera porcentagens.", "link": "Leia a metodologia completa",
      "canList": ["Metadados de arquivo (EXIF / XMP / IPTC)", "Credenciais de proveniência (C2PA / Content Credentials)", "Assinaturas digitais e hashes", "Marcas de plataforma e parâmetros de geração", "Estrutura do contêiner e cabeçalhos de arquivo", "Algumas pistas de edição e exportação", "Blocos de texto PNG", "Metadados de contêiner MP4/MOV e marcadores SEI"],
      "cannotList": ["Que todos os arquivos de IA retenham dados de proveniência", "Que capturas de tela retenham informações de origem", "Que todas as plataformas usem marcas uniformes", "Que a ausência de sinal signifique feito por humano", "Que os resultados substituam perícia jurídica ou avaliação de especialista"]
    },
    "sample": { "title": "Experiência com amostras reais", "subtitle": "Estas amostras vêm de testes reais. Clique para analisar no detector.", "soon": "Amostras reais em breve", "processed": "Processado", "signals": "sinais", "source": "Fonte", "limits": "Limitações conhecidas", "unprocessed": "Não processado" },
    "experiments": { "title": "Experimentos mais recentes", "subtitle": "Resultados reais de testes em lote.", "soon": "Registros dos experimentos mais recentes em breve", "samples": "amostras", "changed": "Resultado alterado", "detail": "Ver detalhes", "parser": "Analisador" }
  }
};

const SUPPORTED_LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR'];

/** Resolve the active language from a URL pathname (first path segment),
 * defaulting to Simplified Chinese for the un-prefixed default route. */
export function resolveLang(pathname) {
  const seg = (pathname || '').split('/').filter(Boolean)[0];
  return SUPPORTED_LANGS.includes(seg) ? seg : 'zh-CN';
}

export function homeStrings(lang) {
  return HOME_I18N[lang] ?? HOME_I18N.en;
}

export { HOME_I18N };

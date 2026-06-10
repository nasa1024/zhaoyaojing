// Localized full-body content for /blog/how-to-detect-gemini-generated-images/
export default {
  'zh-TW': {
    title: '如何檢測 Gemini 生成的圖片和影片？C2PA、XMP Credit 與 SynthID 詳解',
    desc: '用真實 Gemini 原圖拆解 Google 寫入的來源信號：PNG caBX chunk 裡的 C2PA manifest、Google C2PA Core Generator Library、XMP Credit、SynthID 的邊界，以及 Veo 影片線索。',
    lead: 'Google 給 Gemini 生成內容上的「標記」其實有三套：標準化的 C2PA Content Credentials、XMP 裡的署名欄位，以及只有 Google 自己能讀的 SynthID 像素浮水印。能不能檢測出來，主要取決於你手裡的檔案經歷過什麼——原始 PNG 裡證據相當紮實，截圖和通訊軟體轉圖則基本什麼都不剩。',
    sections: [
      {
        h: '先判斷手上是不是原圖',
        ps: [
          '這是檢測前最重要的一步。Gemini 頁面直接下載的 PNG/JPEG 是理想樣本；以下來路的檔案，元數據大概率已被洗掉：截圖（像素重新編碼，原檔案的任何 chunk 都不存在）、通訊軟體傳圖（預設壓縮重編碼）、社群平台儲存的圖（平台轉碼）。用這些檔案測出「無信號」不說明圖是真的，只說明證據沒跟過來。',
        ],
      },
      {
        h: '信號一：C2PA manifest（最硬的證據）',
        ps: [
          '部分 Gemini / Imagen 原圖帶 Google 簽章的 C2PA 紀錄。物理位置取決於格式：PNG 放在類型名為 caBX 的專用 chunk；JPEG 放在 APP11 段（標記 0xFFEB），manifest 超過單段 64KB 上限時按序號拆成多段，讀取時需重組。manifest 裡值得關注的具體內容：claim_generator 寫的是「Google C2PA Core Generator Library」——Google 生成鏈路的標準簽章方標識，正常照片和第三方工具不會出現這個值；actions 斷言裡 digitalSourceType 為 trainedAlgorithmicMedia（純 AI 生成）；整個 manifest 經過 COSE 簽章，竄改內容會破壞簽章——這是它比檔名、XMP 都硬的原因。',
        ],
      },
      {
        h: '信號二：XMP 裡的 Google 署名',
        ps: [
          'C2PA 之外，Google 系生成圖常帶一段 XMP，其中 photoshop:Credit 欄位的值是「Made with Google AI」。這是純文字、沒有簽章，理論上可以偽造，所以證據強度記中等——但配合 C2PA 出現時是很好的旁證。一個容易踩的實戰坑：Gemini 圖片的 XMP 塊不一定在檔案開頭附近，實測遇過出現在好幾 MB 之後的樣本，掃描窗口建議給到檔案前 10MB。',
        ],
      },
      {
        h: '信號三：SynthID——存在，但你讀不了',
        ps: [
          'Google 反覆宣傳的 SynthID 需要單獨說清楚：它是 DeepMind 開發的像素級隱形浮水印，生成時直接織進像素值裡，對轉碼、裁切有一定強健性。但它的嵌入演算法和解碼器都不公開，目前只有 Google 自己的檢測入口能給出 SynthID 判定，任何第三方工具都讀不了。指望本地工具「驗 SynthID」是不現實的；第三方能做的是對浮水印狀統計異常的機率性分析，性質完全不同，可信度也低得多。',
        ],
      },
      {
        h: '檔名與 Veo 影片',
        ps: [
          'Gemini 預設下載名形如 Gemini_Generated_Image_xxxxxx.png。檔名人人可改，單獨只算低可信度的輔助線索，但在「原圖 + 預設檔名 + C2PA 命中」的組合裡，它能讓整個證據鏈更順。影片側：部分 Veo 匯出影片的 MP4 容器裡，©too（編碼工具）欄位的值就是「Google」；部分檔案能掃到 C2PA 相關文字。和圖片同理：轉碼、錄影之後容器層線索基本歸零。',
        ],
      },
    ],
  },
  en: {
    title: 'How to Detect Gemini-Generated Images and Video: C2PA, XMP Credit, and SynthID Explained',
    desc: 'Dissecting the provenance signals Google writes into Gemini output: the C2PA manifest inside the PNG caBX chunk, "Google C2PA Core Generator Library", the XMP Credit field, SynthID’s limits, and Veo video clues.',
    lead: 'Google actually marks Gemini content three different ways: standardized C2PA Content Credentials, a credit field in XMP, and the SynthID pixel watermark that only Google itself can read. Whether you can detect any of it depends mostly on what the file has been through — an original PNG carries solid evidence, while a screenshot or a messenger-forwarded copy carries essentially nothing.',
    sections: [
      {
        h: 'First, establish whether you have the original',
        ps: [
          'This is the single most important step before testing. A PNG/JPEG downloaded straight from the Gemini page is the ideal sample. Files from these routes have most likely been scrubbed: screenshots (pixels re-encoded; none of the original chunks exist), messenger transfers (compressed and re-encoded by default), images saved off social platforms (platform transcoding). A "no signal" result on such files doesn’t say the image is real — only that the evidence didn’t travel with it.',
        ],
      },
      {
        h: 'Signal one: the C2PA manifest (the hardest evidence)',
        ps: [
          'Some Gemini / Imagen originals carry a Google-signed C2PA record. Its physical location depends on the format: in PNG it sits in a dedicated chunk typed caBX; in JPEG it occupies APP11 segments (marker 0xFFEB), split across several segments by sequence number when the manifest exceeds the 64KB per-segment cap — readers must reassemble them. Inside the manifest, the parts worth attention: claim_generator reads "Google C2PA Core Generator Library" — the standard signer identity of Google’s generation pipeline, a value that never appears in normal photos or third-party tools; the actions assertion carries digitalSourceType of trainedAlgorithmicMedia (fully AI-generated); and the whole manifest is COSE-signed, so tampering with the content breaks the signature — which is exactly why it outranks filenames and XMP.',
        ],
      },
      {
        h: 'Signal two: the Google credit in XMP',
        ps: [
          'Beyond C2PA, Google-generated images often ship an XMP packet whose photoshop:Credit field reads "Made with Google AI". It is plain text with no signature, theoretically forgeable, so it rates medium strength — but it makes excellent corroboration when it appears alongside C2PA. One field-tested trap: Gemini’s XMP block is not necessarily near the start of the file. We have seen samples where it sits several megabytes in, so give your scan window the first 10MB of the file.',
        ],
      },
      {
        h: 'Signal three: SynthID — present, but unreadable to you',
        ps: [
          'Google’s much-promoted SynthID deserves a clear statement of its own: it is a pixel-level invisible watermark developed by DeepMind, woven directly into pixel values at generation time, with some robustness against transcoding and cropping. But its embedding algorithm and decoder are not public — today only Google’s own checking surfaces can give a SynthID verdict, and no third-party tool can read it. Expecting a local tool to "verify SynthID" is unrealistic; what third parties can do is probabilistic analysis of watermark-like statistical anomalies, which is a completely different thing with far lower confidence.',
        ],
      },
      {
        h: 'Filenames and Veo video',
        ps: [
          'Gemini’s default download name looks like Gemini_Generated_Image_xxxxxx.png. Anyone can rename a file, so on its own this rates only low confidence — but in the combination "original file + default filename + C2PA hit" it makes the whole evidence chain cleaner. On the video side: some Veo exports carry the bare value "Google" in the MP4 container’s ©too (encoding tool) field, and some files surface C2PA-related text in a scan. Same logic as images: after transcoding or screen recording, container-level clues drop to essentially zero.',
        ],
      },
    ],
  },
  ja: {
    title: 'Gemini 生成の画像・動画を検出するには：C2PA、XMP Credit、SynthID を詳解',
    desc: 'Google が Gemini の出力に書き込む来歴シグナルを解剖：PNG caBX チャンク内の C2PA manifest、「Google C2PA Core Generator Library」、XMP Credit フィールド、SynthID の限界、Veo 動画の手がかり。',
    lead: 'Google は Gemini 生成コンテンツに実は 3 通りの「印」を付けています。標準化された C2PA Content Credentials、XMP 内のクレジットフィールド、そして Google 自身にしか読めない SynthID ピクセル透かしです。検出できるかどうかは、手元のファイルが何を経てきたかでほぼ決まります。オリジナルの PNG にはかなり堅い証拠が残っていますが、スクリーンショットやメッセンジャー転送のコピーにはほぼ何も残りません。',
    sections: [
      {
        h: 'まず手元のファイルが原本かを確かめる',
        ps: [
          'これが検査前の最重要ステップです。Gemini のページから直接ダウンロードした PNG/JPEG が理想のサンプル。次の経路のファイルは、メタデータがほぼ確実に洗い流されています：スクリーンショット（ピクセルが再エンコードされ、元のチャンクは一切存在しない）、メッセンジャー経由の転送（デフォルトで圧縮・再エンコード）、SNS から保存した画像（プラットフォームのトランスコード）。こうしたファイルで「シグナルなし」と出ても、画像が本物だという意味にはなりません。証拠が付いてこなかったというだけです。',
        ],
      },
      {
        h: 'シグナル 1：C2PA manifest（最も堅い証拠）',
        ps: [
          '一部の Gemini / Imagen 原本には Google 署名の C2PA 記録が付いています。物理的な位置はフォーマット次第です。PNG では caBX という型名の専用チャンクに、JPEG では APP11 セグメント（マーカー 0xFFEB）に入り、manifest がセグメント上限の 64KB を超える場合はシーケンス番号で複数セグメントに分割され、読み取り側は再結合が必要です。manifest 内で注目すべきもの：claim_generator の値は「Google C2PA Core Generator Library」——Google 生成パイプラインの標準的な署名者識別子で、通常の写真やサードパーティツールには決して現れません。actions アサーションの digitalSourceType は trainedAlgorithmicMedia（完全 AI 生成）。そして manifest 全体が COSE 署名されているため、内容を改変すると署名が壊れます——ファイル名や XMP より格上の証拠である理由はここにあります。',
        ],
      },
      {
        h: 'シグナル 2：XMP の Google クレジット',
        ps: [
          'C2PA のほかに、Google 系生成画像にはしばしば XMP パケットが付き、photoshop:Credit フィールドに「Made with Google AI」と書かれています。署名のないプレーンテキストで理論上は偽造可能なため、証拠強度は中程度——ただし C2PA と同時に現れたときの傍証としては優秀です。実地で踏みがちな落とし穴をひとつ：Gemini の XMP ブロックはファイル先頭付近にあるとは限りません。数 MB 先にあったサンプルを実際に確認しており、スキャン窓はファイル先頭 10MB を確保するのが安全です。',
        ],
      },
      {
        h: 'シグナル 3：SynthID——存在するが、あなたには読めない',
        ps: [
          'Google が盛んに宣伝する SynthID は、はっきり区別して説明する必要があります。DeepMind が開発したピクセルレベルの不可視透かしで、生成時にピクセル値へ直接織り込まれ、トランスコードやトリミングへの一定の耐性を持ちます。しかし埋め込みアルゴリズムもデコーダーも非公開で、現在 SynthID の判定を出せるのは Google 自身の検出窓口だけ。サードパーティのツールでは読めません。ローカルツールに「SynthID の検証」を期待するのは非現実的です。サードパーティにできるのは透かし様の統計的異常に対する確率的分析であり、性質がまったく異なり、信頼度もはるかに低くなります。',
        ],
      },
      {
        h: 'ファイル名と Veo 動画',
        ps: [
          'Gemini のデフォルトダウンロード名は Gemini_Generated_Image_xxxxxx.png という形式です。ファイル名は誰でも変えられるので単独では低信頼の補助手がかりに過ぎませんが、「原本 + デフォルトファイル名 + C2PA ヒット」の組み合わせでは証拠チェーン全体の筋が通ります。動画側では、一部の Veo 出力の MP4 コンテナで ©too（エンコードツール）フィールドの値がただ「Google」となっており、C2PA 関連テキストがスキャンで見つかるファイルもあります。画像と同じ理屈で、トランスコードや画面録画の後ではコンテナ層の手がかりはほぼゼロになります。',
        ],
      },
    ],
  },
  ko: {
    title: 'Gemini가 생성한 이미지와 비디오 검출법: C2PA, XMP Credit, SynthID 상세 해설',
    desc: 'Google이 Gemini 출력물에 기록하는 출처 신호 해부: PNG caBX 청크 속 C2PA manifest, "Google C2PA Core Generator Library", XMP Credit 필드, SynthID의 한계, Veo 비디오 단서.',
    lead: 'Google은 Gemini 생성 콘텐츠에 사실 세 가지 방식으로 표식을 남깁니다. 표준화된 C2PA Content Credentials, XMP 속 크레딧 필드, 그리고 Google 자신만 읽을 수 있는 SynthID 픽셀 워터마크입니다. 검출 가능 여부는 파일이 무엇을 거쳐 왔는지에 거의 달려 있습니다. 원본 PNG에는 꽤 단단한 증거가 남지만, 스크린샷이나 메신저로 전달된 사본에는 사실상 아무것도 남지 않습니다.',
    sections: [
      {
        h: '먼저 원본인지부터 확인하라',
        ps: [
          '검사 전 가장 중요한 단계입니다. Gemini 페이지에서 직접 내려받은 PNG/JPEG가 이상적인 샘플입니다. 다음 경로의 파일은 메타데이터가 거의 확실히 씻겨 나갔습니다: 스크린샷(픽셀이 재인코딩되어 원본 청크가 하나도 존재하지 않음), 메신저 전송(기본적으로 압축·재인코딩), SNS에서 저장한 이미지(플랫폼 트랜스코딩). 이런 파일에서 "신호 없음"이 나와도 이미지가 진짜라는 뜻이 아니라, 증거가 따라오지 못했다는 뜻일 뿐입니다.',
        ],
      },
      {
        h: '신호 1: C2PA manifest (가장 단단한 증거)',
        ps: [
          '일부 Gemini / Imagen 원본에는 Google이 서명한 C2PA 기록이 있습니다. 물리적 위치는 포맷에 따라 다릅니다. PNG에서는 caBX라는 타입명의 전용 청크에, JPEG에서는 APP11 세그먼트(마커 0xFFEB)에 들어가며, manifest가 세그먼트당 64KB 상한을 넘으면 시퀀스 번호로 여러 세그먼트에 나뉘어 읽는 쪽에서 재조립해야 합니다. manifest 안에서 주목할 부분: claim_generator 값은 "Google C2PA Core Generator Library" — Google 생성 파이프라인의 표준 서명자 식별자로, 일반 사진이나 서드파티 도구에는 절대 나타나지 않습니다. actions 어서션의 digitalSourceType은 trainedAlgorithmicMedia(완전 AI 생성)이고, manifest 전체가 COSE 서명되어 내용을 변조하면 서명이 깨집니다 — 파일명이나 XMP보다 격이 높은 증거인 이유입니다.',
        ],
      },
      {
        h: '신호 2: XMP 속 Google 크레딧',
        ps: [
          'C2PA 외에도 Google 계열 생성 이미지에는 photoshop:Credit 필드에 "Made with Google AI"라고 적힌 XMP 패킷이 자주 동봉됩니다. 서명 없는 일반 텍스트라 이론상 위조 가능하므로 증거 강도는 중간 — 다만 C2PA와 함께 나타나면 훌륭한 보강 증거가 됩니다. 실전에서 빠지기 쉬운 함정 하나: Gemini의 XMP 블록이 파일 앞부분에 있다고 가정하지 마세요. 몇 MB 뒤에 있던 샘플을 실제로 확인했으며, 스캔 윈도는 파일 앞 10MB로 잡는 것이 안전합니다.',
        ],
      },
      {
        h: '신호 3: SynthID — 존재하지만, 당신은 읽을 수 없다',
        ps: [
          'Google이 대대적으로 홍보하는 SynthID는 따로 분명히 짚어야 합니다. DeepMind가 개발한 픽셀 수준 비가시 워터마크로, 생성 시점에 픽셀 값에 직접 짜여 들어가며 트랜스코딩과 자르기에 어느 정도 견딥니다. 그러나 임베딩 알고리즘과 디코더가 비공개라서, 현재 SynthID 판정을 내릴 수 있는 것은 Google 자체 검사 창구뿐이고 어떤 서드파티 도구도 읽지 못합니다. 로컬 도구에 "SynthID 검증"을 기대하는 것은 비현실적입니다. 서드파티가 할 수 있는 것은 워터마크 유사 통계 이상에 대한 확률적 분석인데, 이는 성격이 완전히 다르고 신뢰도도 훨씬 낮습니다.',
        ],
      },
      {
        h: '파일명과 Veo 비디오',
        ps: [
          'Gemini의 기본 다운로드명은 Gemini_Generated_Image_xxxxxx.png 형식입니다. 파일명은 누구나 바꿀 수 있어 단독으로는 낮은 신뢰도의 보조 단서일 뿐이지만, "원본 + 기본 파일명 + C2PA 일치" 조합에서는 증거 사슬 전체를 더 매끄럽게 만듭니다. 비디오 쪽에서는 일부 Veo 출력물의 MP4 컨테이너 ©too(인코딩 도구) 필드에 "Google"이라는 값만 들어 있고, 일부 파일에서는 스캔으로 C2PA 관련 텍스트가 잡힙니다. 이미지와 같은 논리로, 트랜스코딩이나 화면 녹화 후에는 컨테이너 층 단서가 사실상 0이 됩니다.',
        ],
      },
    ],
  },
  de: {
    title: 'Gemini-generierte Bilder und Videos erkennen: C2PA, XMP Credit und SynthID erklärt',
    desc: 'Die Herkunftssignale, die Google in Gemini-Ausgaben schreibt, seziert: das C2PA-Manifest im PNG-caBX-Chunk, „Google C2PA Core Generator Library", das XMP-Credit-Feld, die Grenzen von SynthID und Veo-Video-Spuren.',
    lead: 'Google markiert Gemini-Inhalte tatsächlich auf drei Arten: mit standardisierten C2PA Content Credentials, einem Credit-Feld im XMP und dem SynthID-Pixelwasserzeichen, das nur Google selbst lesen kann. Ob sich davon etwas nachweisen lässt, hängt vor allem davon ab, was die Datei durchgemacht hat — ein Original-PNG trägt solide Beweise, ein Screenshot oder eine per Messenger weitergeleitete Kopie im Wesentlichen nichts.',
    sections: [
      {
        h: 'Zuerst klären: Liegt das Original vor?',
        ps: [
          'Das ist der wichtigste Schritt vor jedem Test. Ein direkt von der Gemini-Seite heruntergeladenes PNG/JPEG ist die ideale Probe. Dateien aus diesen Quellen sind höchstwahrscheinlich bereinigt: Screenshots (Pixel neu kodiert; keiner der ursprünglichen Chunks existiert), Messenger-Übertragungen (standardmäßig komprimiert und neu kodiert), von Social-Plattformen gespeicherte Bilder (Plattform-Transcoding). Ein „kein Signal"-Ergebnis bei solchen Dateien besagt nicht, dass das Bild echt ist — nur, dass die Beweise nicht mitgereist sind.',
        ],
      },
      {
        h: 'Signal eins: das C2PA-Manifest (der härteste Beweis)',
        ps: [
          'Manche Gemini-/Imagen-Originale tragen ein von Google signiertes C2PA-Protokoll. Der physische Ort hängt vom Format ab: In PNG sitzt es in einem eigenen Chunk vom Typ caBX; in JPEG belegt es APP11-Segmente (Marker 0xFFEB), bei Überschreiten der 64-KB-Segmentgrenze per Sequenznummer auf mehrere Segmente verteilt — Leser müssen sie wieder zusammensetzen. Im Manifest verdient Beachtung: claim_generator lautet „Google C2PA Core Generator Library" — die Standard-Signaturidentität von Googles Generierungspipeline, ein Wert, der in normalen Fotos oder Drittanbieter-Tools nie auftaucht; die actions-Assertion trägt digitalSourceType trainedAlgorithmicMedia (vollständig AI-generiert); und das gesamte Manifest ist COSE-signiert, Manipulation am Inhalt bricht die Signatur — genau deshalb sticht es Dateinamen und XMP aus.',
        ],
      },
      {
        h: 'Signal zwei: der Google-Credit im XMP',
        ps: [
          'Neben C2PA liefern Google-generierte Bilder oft ein XMP-Paket mit, dessen photoshop:Credit-Feld „Made with Google AI" lautet. Es ist unsignierter Klartext, theoretisch fälschbar, daher mittlere Beweiskraft — aber hervorragende Bestätigung, wenn es neben C2PA auftritt. Eine praxiserprobte Falle: Geminis XMP-Block liegt nicht unbedingt nahe dem Dateianfang. Wir haben Proben gesehen, bei denen er mehrere Megabyte tief saß — das Scanfenster sollte die ersten 10 MB der Datei umfassen.',
        ],
      },
      {
        h: 'Signal drei: SynthID — vorhanden, aber für Sie unlesbar',
        ps: [
          'Googles vielbeworbene SynthID verdient eine klare eigene Einordnung: ein von DeepMind entwickeltes unsichtbares Wasserzeichen auf Pixelebene, bei der Generierung direkt in die Pixelwerte eingewoben, mit gewisser Robustheit gegen Transcoding und Beschnitt. Aber Einbettungsalgorithmus und Decoder sind nicht öffentlich — ein SynthID-Urteil können heute nur Googles eigene Prüfoberflächen fällen, kein Drittanbieter-Tool kann es lesen. Von einem lokalen Tool eine „SynthID-Verifikation" zu erwarten, ist unrealistisch; was Dritte können, ist probabilistische Analyse wasserzeichenartiger statistischer Anomalien — etwas völlig anderes mit deutlich geringerer Konfidenz.',
        ],
      },
      {
        h: 'Dateinamen und Veo-Video',
        ps: [
          'Geminis Standard-Downloadname sieht aus wie Gemini_Generated_Image_xxxxxx.png. Dateinamen kann jeder ändern, allein zählt das nur als schwacher Hinweis — aber in der Kombination „Originaldatei + Standardname + C2PA-Treffer" macht er die Beweiskette runder. Auf der Videoseite: Manche Veo-Exporte tragen den nackten Wert „Google" im ©too-Feld (Kodierwerkzeug) des MP4-Containers, und in manchen Dateien fördert ein Scan C2PA-bezogene Texte zutage. Dieselbe Logik wie bei Bildern: Nach Transcoding oder Bildschirmaufnahme fallen die Container-Spuren auf praktisch null.',
        ],
      },
    ],
  },
  fr: {
    title: 'Détecter les images et vidéos générées par Gemini : C2PA, XMP Credit et SynthID expliqués',
    desc: 'Dissection des signaux de provenance que Google écrit dans les sorties Gemini : le manifest C2PA dans le chunk PNG caBX, « Google C2PA Core Generator Library », le champ XMP Credit, les limites de SynthID et les indices vidéo Veo.',
    lead: 'Google marque en réalité les contenus Gemini de trois façons : des Content Credentials C2PA standardisés, un champ de crédit dans le XMP, et le filigrane pixel SynthID que seul Google peut lire. Que vous puissiez en détecter quoi que ce soit dépend surtout de ce que le fichier a traversé — un PNG original porte des preuves solides, une capture d’écran ou une copie transférée par messagerie ne porte pour l’essentiel rien.',
    sections: [
      {
        h: 'D’abord, établir si vous avez l’original',
        ps: [
          'C’est l’étape la plus importante avant tout test. Un PNG/JPEG téléchargé directement depuis la page Gemini est l’échantillon idéal. Les fichiers issus de ces circuits ont très probablement été nettoyés : captures d’écran (pixels réencodés ; aucun des chunks d’origine n’existe), transferts par messagerie (compressés et réencodés par défaut), images enregistrées depuis les réseaux sociaux (transcodage de plateforme). Un résultat « aucun signal » sur de tels fichiers ne dit pas que l’image est vraie — seulement que la preuve n’a pas voyagé avec elle.',
        ],
      },
      {
        h: 'Signal un : le manifest C2PA (la preuve la plus dure)',
        ps: [
          'Certains originaux Gemini / Imagen portent un registre C2PA signé par Google. Son emplacement physique dépend du format : en PNG, il loge dans un chunk dédié de type caBX ; en JPEG, il occupe des segments APP11 (marqueur 0xFFEB), répartis sur plusieurs segments par numéro de séquence quand le manifest dépasse le plafond de 64 Ko par segment — le lecteur doit les réassembler. Dans le manifest, les éléments dignes d’attention : claim_generator vaut « Google C2PA Core Generator Library » — l’identité de signataire standard du pipeline de génération de Google, une valeur qui n’apparaît jamais dans les photos normales ni les outils tiers ; l’assertion actions porte un digitalSourceType à trainedAlgorithmicMedia (entièrement généré par IA) ; et tout le manifest est signé COSE, toute altération du contenu casse la signature — exactement la raison pour laquelle il surclasse noms de fichiers et XMP.',
        ],
      },
      {
        h: 'Signal deux : le crédit Google dans le XMP',
        ps: [
          'Au-delà du C2PA, les images générées par Google embarquent souvent un paquet XMP dont le champ photoshop:Credit vaut « Made with Google AI ». C’est du texte brut sans signature, théoriquement falsifiable, donc de force moyenne — mais une excellente corroboration quand il apparaît aux côtés du C2PA. Un piège éprouvé sur le terrain : le bloc XMP de Gemini n’est pas forcément près du début du fichier. Nous avons vu des échantillons où il se trouvait à plusieurs mégaoctets de profondeur — donnez à votre fenêtre de scan les 10 premiers Mo du fichier.',
        ],
      },
      {
        h: 'Signal trois : SynthID — présent, mais illisible pour vous',
        ps: [
          'Le SynthID tant vanté par Google mérite une mise au point claire : c’est un filigrane invisible au niveau des pixels développé par DeepMind, tissé directement dans les valeurs de pixels à la génération, avec une certaine robustesse au transcodage et au recadrage. Mais son algorithme d’incrustation et son décodeur ne sont pas publics — aujourd’hui, seules les interfaces de vérification de Google peuvent rendre un verdict SynthID, et aucun outil tiers ne peut le lire. Attendre d’un outil local qu’il « vérifie SynthID » est irréaliste ; ce que les tiers peuvent faire, c’est une analyse probabiliste d’anomalies statistiques évoquant un filigrane — une chose complètement différente, à la confiance bien moindre.',
        ],
      },
      {
        h: 'Noms de fichiers et vidéo Veo',
        ps: [
          'Le nom de téléchargement par défaut de Gemini ressemble à Gemini_Generated_Image_xxxxxx.png. N’importe qui peut renommer un fichier, donc seul, cela ne vaut qu’une faible confiance — mais dans la combinaison « fichier original + nom par défaut + correspondance C2PA », il rend toute la chaîne de preuves plus propre. Côté vidéo : certains exports Veo portent la valeur nue « Google » dans le champ ©too (outil d’encodage) du conteneur MP4, et certains fichiers font remonter des textes liés au C2PA lors d’un scan. Même logique que pour les images : après transcodage ou enregistrement d’écran, les indices au niveau du conteneur tombent pratiquement à zéro.',
        ],
      },
    ],
  },
  es: {
    title: 'Cómo detectar imágenes y videos generados por Gemini: C2PA, XMP Credit y SynthID explicados',
    desc: 'Disección de las señales de procedencia que Google escribe en la salida de Gemini: el manifest C2PA dentro del chunk PNG caBX, "Google C2PA Core Generator Library", el campo XMP Credit, los límites de SynthID y pistas de video Veo.',
    lead: 'Google marca el contenido de Gemini de tres maneras: Content Credentials C2PA estandarizados, un campo de crédito en el XMP y la marca de agua de píxeles SynthID que solo Google puede leer. Que pueda detectar algo de esto depende sobre todo de lo que haya atravesado el archivo — un PNG original lleva evidencia sólida, mientras que una captura de pantalla o una copia reenviada por mensajería no lleva esencialmente nada.',
    sections: [
      {
        h: 'Primero, establezca si tiene el original',
        ps: [
          'Es el paso más importante antes de probar. Un PNG/JPEG descargado directamente de la página de Gemini es la muestra ideal. Los archivos de estas rutas muy probablemente fueron limpiados: capturas de pantalla (píxeles reencodeados; no existe ninguno de los chunks originales), transferencias por mensajería (comprimidas y reencodeadas por defecto), imágenes guardadas de redes sociales (transcodificación de plataforma). Un resultado de «sin señal» en tales archivos no dice que la imagen sea real — solo que la evidencia no viajó con ella.',
        ],
      },
      {
        h: 'Señal uno: el manifest C2PA (la evidencia más dura)',
        ps: [
          'Algunos originales de Gemini / Imagen llevan un registro C2PA firmado por Google. Su ubicación física depende del formato: en PNG reside en un chunk dedicado de tipo caBX; en JPEG ocupa segmentos APP11 (marcador 0xFFEB), repartidos en varios segmentos por número de secuencia cuando el manifest supera el tope de 64 KB por segmento — el lector debe reensamblarlos. Dentro del manifest, lo que merece atención: claim_generator dice "Google C2PA Core Generator Library" — la identidad de firmante estándar del pipeline de generación de Google, un valor que jamás aparece en fotos normales ni herramientas de terceros; la assertion actions lleva digitalSourceType en trainedAlgorithmicMedia (totalmente generado por IA); y todo el manifest está firmado con COSE, así que manipular el contenido rompe la firma — exactamente por eso supera a nombres de archivo y XMP.',
        ],
      },
      {
        h: 'Señal dos: el crédito de Google en el XMP',
        ps: [
          'Más allá del C2PA, las imágenes generadas por Google suelen incluir un paquete XMP cuyo campo photoshop:Credit dice "Made with Google AI". Es texto plano sin firma, teóricamente falsificable, así que puntúa fuerza media — pero es excelente corroboración cuando aparece junto al C2PA. Una trampa probada en campo: el bloque XMP de Gemini no está necesariamente cerca del inicio del archivo. Hemos visto muestras donde estaba a varios megabytes de profundidad — dele a su ventana de escaneo los primeros 10 MB del archivo.',
        ],
      },
      {
        h: 'Señal tres: SynthID — presente, pero ilegible para usted',
        ps: [
          'El tan promocionado SynthID de Google merece su propia aclaración: es una marca de agua invisible a nivel de píxel desarrollada por DeepMind, tejida directamente en los valores de píxeles al generar, con cierta robustez frente a transcodificación y recorte. Pero su algoritmo de incrustación y su decodificador no son públicos — hoy solo las interfaces de verificación del propio Google pueden emitir un veredicto SynthID, y ninguna herramienta de terceros puede leerlo. Esperar que una herramienta local «verifique SynthID» es irrealista; lo que los terceros pueden hacer es análisis probabilístico de anomalías estadísticas con apariencia de marca de agua — algo completamente distinto y con mucha menor confianza.',
        ],
      },
      {
        h: 'Nombres de archivo y video Veo',
        ps: [
          'El nombre de descarga por defecto de Gemini luce como Gemini_Generated_Image_xxxxxx.png. Cualquiera puede renombrar un archivo, así que por sí solo vale solo confianza baja — pero en la combinación «archivo original + nombre por defecto + acierto C2PA» deja toda la cadena de evidencia más limpia. Del lado del video: algunos exports de Veo llevan el valor escueto «Google» en el campo ©too (herramienta de codificación) del contenedor MP4, y en algunos archivos un escaneo revela textos relacionados con C2PA. Misma lógica que con imágenes: tras transcodificar o grabar la pantalla, las pistas a nivel de contenedor caen prácticamente a cero.',
        ],
      },
    ],
  },
  'pt-BR': {
    title: 'Como detectar imagens e vídeos gerados pelo Gemini: C2PA, XMP Credit e SynthID explicados',
    desc: 'Dissecando os sinais de procedência que o Google grava na saída do Gemini: o manifest C2PA dentro do chunk PNG caBX, "Google C2PA Core Generator Library", o campo XMP Credit, os limites do SynthID e pistas de vídeo do Veo.',
    lead: 'O Google marca o conteúdo do Gemini de três maneiras: Content Credentials C2PA padronizados, um campo de crédito no XMP e a marca-d’água de pixels SynthID que só o próprio Google consegue ler. Se você consegue detectar algo disso depende sobretudo do que o arquivo atravessou — um PNG original carrega evidência sólida, enquanto uma captura de tela ou uma cópia encaminhada por mensageiro não carrega essencialmente nada.',
    sections: [
      {
        h: 'Primeiro, estabeleça se você tem o original',
        ps: [
          'É o passo mais importante antes de testar. Um PNG/JPEG baixado direto da página do Gemini é a amostra ideal. Arquivos dessas rotas muito provavelmente foram limpos: capturas de tela (pixels reencodados; nenhum dos chunks originais existe), transferências por mensageiro (comprimidas e reencodadas por padrão), imagens salvas de redes sociais (transcodificação da plataforma). Um resultado de "sem sinal" nesses arquivos não diz que a imagem é real — só que a evidência não viajou com ela.',
        ],
      },
      {
        h: 'Sinal um: o manifest C2PA (a evidência mais dura)',
        ps: [
          'Alguns originais do Gemini / Imagen carregam um registro C2PA assinado pelo Google. A localização física depende do formato: no PNG, mora num chunk dedicado do tipo caBX; no JPEG, ocupa segmentos APP11 (marcador 0xFFEB), divididos em vários segmentos por número de sequência quando o manifest excede o teto de 64 KB por segmento — o leitor precisa remontá-los. Dentro do manifest, o que merece atenção: claim_generator diz "Google C2PA Core Generator Library" — a identidade padrão de assinante do pipeline de geração do Google, um valor que jamais aparece em fotos normais ou ferramentas de terceiros; a assertion actions traz digitalSourceType em trainedAlgorithmicMedia (totalmente gerado por IA); e o manifest inteiro é assinado com COSE, então adulterar o conteúdo quebra a assinatura — exatamente por isso ele supera nomes de arquivo e XMP.',
        ],
      },
      {
        h: 'Sinal dois: o crédito do Google no XMP',
        ps: [
          'Além do C2PA, imagens geradas pelo Google costumam vir com um pacote XMP cujo campo photoshop:Credit diz "Made with Google AI". É texto puro sem assinatura, teoricamente forjável, então pontua força média — mas é ótima corroboração quando aparece ao lado do C2PA. Uma armadilha testada em campo: o bloco XMP do Gemini não está necessariamente perto do início do arquivo. Já vimos amostras em que ele estava a vários megabytes de profundidade — dê à sua janela de varredura os primeiros 10 MB do arquivo.',
        ],
      },
      {
        h: 'Sinal três: SynthID — presente, mas ilegível para você',
        ps: [
          'O tão promovido SynthID do Google merece um esclarecimento próprio: é uma marca-d’água invisível em nível de pixel desenvolvida pela DeepMind, tecida diretamente nos valores dos pixels na geração, com certa robustez a transcodificação e corte. Mas seu algoritmo de embutimento e seu decodificador não são públicos — hoje só as interfaces de verificação do próprio Google podem dar um veredito SynthID, e nenhuma ferramenta de terceiros consegue lê-lo. Esperar que uma ferramenta local "verifique o SynthID" é irrealista; o que terceiros podem fazer é análise probabilística de anomalias estatísticas com cara de marca-d’água — algo completamente diferente e com confiança bem menor.',
        ],
      },
      {
        h: 'Nomes de arquivo e vídeo do Veo',
        ps: [
          'O nome padrão de download do Gemini se parece com Gemini_Generated_Image_xxxxxx.png. Qualquer um pode renomear um arquivo, então sozinho isso vale só confiança baixa — mas na combinação "arquivo original + nome padrão + acerto de C2PA" ele deixa toda a cadeia de evidência mais redonda. No lado do vídeo: alguns exports do Veo trazem o valor seco "Google" no campo ©too (ferramenta de codificação) do contêiner MP4, e em alguns arquivos uma varredura revela textos ligados ao C2PA. Mesma lógica das imagens: depois de transcodificar ou gravar a tela, as pistas no nível do contêiner caem praticamente a zero.',
        ],
      },
    ],
  },
};

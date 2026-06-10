// Localized full-body content for /blog/ai-image-metadata-guide/
export default {
  'zh-TW': {
    title: 'AI 媒體元數據完整指南：EXIF、XMP、C2PA、PNG tEXt、MP4 全解析',
    desc: '逐位元組拆解 AI 平台寫入圖片和影片的元數據：EXIF UserComment 裡的 AIGC JSON、XMP DigitalSourceType、PNG tEXt 生成參數、MP4 ilst 與 SEI marker。',
    lead: '幾乎每個生成平台都會在匯出的檔案裡留下點東西。有的寫得大大方方，比如 Stable Diffusion 把完整提示詞塞進 PNG 文字塊；有的藏得很深，比如 Gemini 的 XMP 塊可能出現在檔案幾 MB 之後；還有的用了加密簽章（C2PA）。這篇按檔案格式逐一拆解這些元數據存在哪、長什麼樣、怎麼讀。',
    sections: [
      {
        h: '先建立直覺：元數據存在檔案的哪裡',
        ps: [
          '一個圖片或影片檔，本質上是「像素/幀資料 + 若干元數據容器」。JPEG 用段（segment），每段以 0xFF 加標記位元組開頭；PNG 用塊（chunk），每塊是 4 位元組長度 + 4 位元組類型名 + 資料 + CRC；MP4/MOV 用盒（box），可層層嵌套。理解這一點，「為什麼截圖會丟失所有元數據」就不難解釋了——截圖只拿到螢幕像素，重新編碼成全新檔案，原本的 segment、chunk、box 根本沒機會跟過來。',
        ],
      },
      {
        h: 'EXIF：最老牌，也最容易被改',
        ps: [
          '與 AI 檢測相關的欄位：Software（處理軟體名）、Make/Model（真照片幾乎都有，AI 圖通常沒有）、ImageDescription/UserComment（可能含提示詞）、Artist（有些平台寫入帳號 ID 的雜湊——32 位以上的十六進位字串本身就是弱信號）。一個實作上的坑：UserComment 前 8 位元組是字元編碼標識（如 ASCII\\0\\0\\0），不跳過直接解碼會看到亂碼。',
          '近年值得注意的是中國平台的 AIGC 標識：依《人工智慧生成合成內容標識辦法》的隱式標識要求，部分平台在 UserComment 寫入 JSON，Label 為 "1" 表示 AI 生成，ContentProducer 是可反查平台的註冊編碼（如 001191110000802100433B 開頭對應通義 Qwen）。另一個反向啟發式：若 Software 命中 AI 工具名，且 FocalLength、FNumber、ExposureTime 等十來個拍攝欄位一個都沒有，判斷就更紮實。',
        ],
      },
      {
        h: 'XMP 與 PNG 文字塊',
        ps: [
          'XMP 是以 <x:xmpmeta> 包裹的 RDF/XML。關鍵屬性：Iptc4xmpExt:DigitalSourceType（trainedAlgorithmicMedia 為標準 AI 聲明）、xmp:CreatorTool（Midjourney 等會寫）、photoshop:Credit（Google 系常見 "Made with Google AI"）。實戰注意：別假設 XMP 一定在檔案開頭附近——實測 Gemini 圖的 XMP 可能在好幾 MB 之後，掃描窗口建議給到 10MB。',
          'PNG 文字塊（tEXt/iTXt/zTXt）是開源生成生態的「戶口本」：AUTOMATIC1111 把正負提示詞、Steps、Sampler、CFG、Seed、模型雜湊全寫進 parameters 鍵；ComfyUI 的 workflow 鍵存完整節點圖 JSON，可直接拖回去複現；InvokeAI 用 invokeai_metadata。命中即實錘——正常照片不可能出現採樣器參數。但只要另存為 JPEG 或被不保留文字塊的工具處理一遍，就全沒了。',
        ],
      },
      {
        h: 'MP4 / MOV：影片容器的三類線索',
        ps: [
          '影片元數據走 box 樹 moov → udta → meta → ilst。三類東西值得查：一是工具欄位——©too、©swr、encoder、tool、software 的值若命中 AI 工具名是中強度信號（部分 Veo 影片的 ©too 就是一個 "Google"）；二是 AIGC 標籤——中國平台在 ilst 寫鍵名為 AIGC 的 JSON 條目，ContentProducer 可反查（001191330106MA2CFLDG4R10001 對應通義萬相 Wan）；三是 SEI marker——H.264/H.265 碼流裡的 ASCII 工具標記（kling-ai、sora、runway、pika-labs、luma-ai 等），藏在碼流而非容器中，重新封裝刪不掉它，但重新編碼會。C2PA 也可進 MP4（uuid box），Sora 部分匯出就帶。',
        ],
      },
      {
        h: '自己動手讀',
        ps: [
          'ExifTool 一個就夠：exiftool -a -G1 -s 列全部元數據；exiftool -b -UserComment 看 AIGC JSON 原文；exiftool -xmp -b 提取 XMP。C2PA 用官方 c2patool 或 contentcredentials.org/verify 做完整簽章驗證。只想快速掃一遍、不想裝工具的話，本站在瀏覽器裡就能把上述位置全查完——檔案在本機解析，不上傳。',
        ],
      },
    ],
  },
  en: {
    title: 'The AI Media Metadata Guide: EXIF, XMP, C2PA, PNG tEXt, and MP4, Byte by Byte',
    desc: 'Where AI platforms actually write their traces: the AIGC JSON inside EXIF UserComment, XMP DigitalSourceType, full generation recipes in PNG text chunks, MP4 ilst fields and SEI markers.',
    lead: 'Nearly every generator leaves something in its exported files. Some are blunt about it — Stable Diffusion stuffs the entire prompt into a PNG text chunk. Some bury it deep — Gemini’s XMP block can sit several megabytes into the file. Some sign it cryptographically (C2PA). This guide walks through each format: where the metadata lives, what it looks like, and how to read it. Every field name and offset here comes from a real detector implementation, not hearsay.',
    sections: [
      {
        h: 'First, an intuition: where metadata lives in a file',
        ps: [
          'An image or video file is essentially "pixel/frame data plus a set of metadata containers". JPEG uses segments, each starting with 0xFF and a marker byte; PNG uses chunks — 4-byte length, 4-byte type name, data, CRC; MP4/MOV uses nested boxes. Once you see this, "why do screenshots erase all metadata" answers itself: a screenshot only captures screen pixels and re-encodes them into a brand-new file — the original segments, chunks and boxes never come along.',
        ],
      },
      {
        h: 'EXIF: the oldest, and the easiest to forge',
        ps: [
          'The AI-relevant fields: Software (processing tool name), Make/Model (real photos almost always have them; AI images usually don’t), ImageDescription/UserComment (may contain prompts), and Artist (some platforms write an account-ID hash — a 32+ character hex string is itself a weak signal). One implementation gotcha: the first 8 bytes of UserComment are a character-code prefix (e.g. ASCII\\0\\0\\0); decode without skipping it and you get garbage.',
          'Worth knowing about: the Chinese AIGC label. Under China’s AI content labeling rules, some platforms write a JSON object into UserComment where Label "1" declares AI generation and ContentProducer is a registration code traceable to the platform (codes starting 001191110000802100433B map to Qwen). And a reverse heuristic: if Software matches an AI tool and none of the dozen camera fields (FocalLength, FNumber, ExposureTime, ISO…) are present, the call gets firmer.',
        ],
      },
      {
        h: 'XMP and PNG text chunks',
        ps: [
          'XMP is RDF/XML wrapped in <x:xmpmeta>. The key properties: Iptc4xmpExt:DigitalSourceType (trainedAlgorithmicMedia is the standard AI declaration), xmp:CreatorTool (written by Midjourney among others), and photoshop:Credit ("Made with Google AI" is common on Google images). A field-tested warning: don’t assume XMP sits near the start of the file — Gemini images have shipped XMP several megabytes in, so give your scan window 10MB.',
          'PNG text chunks (tEXt/iTXt/zTXt) are the household register of the open-source ecosystem: AUTOMATIC1111 writes positive and negative prompts, Steps, Sampler, CFG scale, Seed and model hash into a parameters key; ComfyUI stores its entire node graph as JSON under workflow — you can drag it back in and reproduce the run; InvokeAI uses invokeai_metadata. A hit here is a smoking gun — no photograph contains sampler settings. But one "save as JPEG" or any tool that drops text chunks, and it’s all gone.',
        ],
      },
      {
        h: 'MP4 / MOV: three kinds of clues in the video container',
        ps: [
          'Video metadata follows the box tree moov → udta → meta → ilst. Three things to check. Tool fields: if ©too, ©swr, encoder, tool or software match a known AI tool, that’s a medium-strength signal (some Veo exports carry a bare "Google" in ©too). The AIGC label: Chinese platforms write an ilst entry keyed AIGC holding JSON whose ContentProducer is traceable (001191330106MA2CFLDG4R10001 maps to Wan). SEI markers: ASCII tool tags inside the H.264/H.265 bitstream itself (kling-ai, sora, runway, pika-labs, luma-ai and others) — they live in the stream, not the container, so remuxing can’t remove them, though re-encoding will. C2PA can ride in MP4 too (a uuid box); some Sora exports carry it.',
        ],
      },
      {
        h: 'Reading it all yourself',
        ps: [
          'ExifTool alone covers most of it: exiftool -a -G1 -s lists everything grouped by source; exiftool -b -UserComment dumps the raw AIGC JSON; exiftool -xmp -b extracts the XMP packet. For C2PA, the official c2patool or contentcredentials.org/verify does full signature-chain verification. And if you just want a quick pass without installing anything, this site scans every location above in your browser — files are parsed locally and never uploaded.',
        ],
      },
    ],
  },
  ja: {
    title: 'AI メディアメタデータ完全ガイド：EXIF、XMP、C2PA、PNG tEXt、MP4 をバイト単位で',
    desc: 'AI プラットフォームが実際に痕跡を書き込む場所：EXIF UserComment 内の AIGC JSON、XMP DigitalSourceType、PNG テキストチャンクの生成レシピ、MP4 ilst フィールドと SEI マーカー。',
    lead: 'ほぼすべての生成ツールは、書き出したファイルに何かを残します。Stable Diffusion のようにプロンプト一式を PNG テキストチャンクに堂々と書き込むものもあれば、Gemini のように XMP ブロックがファイルの数 MB 先に潜んでいるものも、C2PA のように暗号署名を付けるものもあります。この記事はフォーマットごとに、メタデータがどこにあり、どんな形をしていて、どう読むかを解説します。挙げるフィールド名やオフセットはすべて実際の検出器の実装に基づくものです。',
    sections: [
      {
        h: 'まず直感をつくる：メタデータはファイルのどこにあるか',
        ps: [
          '画像・動画ファイルの本質は「ピクセル/フレームデータ + 複数のメタデータコンテナ」です。JPEG はセグメント（各セグメントは 0xFF とマーカーバイトで始まる）、PNG はチャンク（4 バイト長 + 4 バイト型名 + データ + CRC）、MP4/MOV は入れ子のボックスを使います。これが分かれば「なぜスクリーンショットで全メタデータが消えるのか」は自明です。スクリーンショットは画面のピクセルだけを取得して新しいファイルに再エンコードするため、元のセグメントやチャンク、ボックスは一切引き継がれません。',
        ],
      },
      {
        h: 'EXIF：最古参にして最も偽造しやすい',
        ps: [
          'AI 検出に関わるフィールドは、Software（処理ツール名）、Make/Model（実写にはほぼ必ずあり、AI 画像にはたいてい無い）、ImageDescription/UserComment（プロンプトが入ることも）、Artist（アカウント ID のハッシュを書くプラットフォームがあり、32 文字以上の 16 進文字列はそれ自体が弱いシグナル）です。実装上の落とし穴：UserComment の先頭 8 バイトは文字コード識別子（例：ASCII\\0\\0\\0）で、スキップせずにデコードすると文字化けします。',
          '近年注目すべきは中国系プラットフォームの AIGC ラベルです。中国の AI コンテンツ標識規制の暗黙的標識要件に従い、一部プラットフォームは UserComment に JSON を書き込みます。Label が "1" なら AI 生成の宣言、ContentProducer はプラットフォームに遡れる登録コードです（001191110000802100433B で始まるコードは通義 Qwen に対応）。逆方向のヒューリスティックも有効です：Software が AI ツールに一致し、かつ FocalLength、FNumber、ExposureTime など十数個の撮影フィールドが 1 つも無ければ、判定はより固くなります。',
        ],
      },
      {
        h: 'XMP と PNG テキストチャンク',
        ps: [
          'XMP は <x:xmpmeta> で包まれた RDF/XML です。重要プロパティは Iptc4xmpExt:DigitalSourceType（trainedAlgorithmicMedia が標準的な AI 宣言）、xmp:CreatorTool（Midjourney などが書き込む）、photoshop:Credit（Google 系画像で "Made with Google AI" が一般的）。実地で得た注意点：XMP がファイル先頭付近にあると思い込まないこと。Gemini の画像では XMP が数 MB 先に置かれていた例があり、スキャン窓は 10MB 取るのが安全です。',
          'PNG テキストチャンク（tEXt/iTXt/zTXt）はオープンソース生成エコシステムの「戸籍」です。AUTOMATIC1111 は parameters キーに正負プロンプト、Steps、Sampler、CFG、Seed、モデルハッシュを書き込み、ComfyUI は workflow キーにノードグラフ全体を JSON で保存します（ドラッグして戻せば再現可能）。InvokeAI は invokeai_metadata を使います。ここでヒットすれば決定的——写真にサンプラー設定が入ることはありません。ただし JPEG への「名前を付けて保存」一回、あるいはテキストチャンクを保持しないツールを一度通すだけで全部消えます。',
        ],
      },
      {
        h: 'MP4 / MOV：動画コンテナの 3 種類の手がかり',
        ps: [
          '動画メタデータは moov → udta → meta → ilst というボックスツリーをたどります。確認すべきは 3 つ。ツールフィールド：©too、©swr、encoder、tool、software の値が既知の AI ツールに一致すれば中程度のシグナル（一部の Veo 出力は ©too にただ "Google" とだけ入っています）。AIGC ラベル：中国系プラットフォームは ilst に AIGC というキーで JSON を書き、ContentProducer から遡れます（001191330106MA2CFLDG4R10001 は通義万相 Wan に対応）。SEI マーカー：H.264/H.265 ビットストリーム内の ASCII ツールタグ（kling-ai、sora、runway、pika-labs、luma-ai など）。コンテナではなくストリーム側にあるため再多重化では消えませんが、再エンコードでは消えます。C2PA も MP4 に入ることがあり（uuid ボックス）、Sora の一部出力が該当します。',
        ],
      },
      {
        h: '自分で読むには',
        ps: [
          'ほとんどは ExifTool 一つで足ります。exiftool -a -G1 -s で全メタデータをソース別に一覧、exiftool -b -UserComment で AIGC JSON の原文をダンプ、exiftool -xmp -b で XMP パケットを抽出。C2PA は公式の c2patool か contentcredentials.org/verify で署名チェーンの完全検証ができます。何もインストールせず手早く確認したいなら、本サイトが上記の場所をすべてブラウザ内でスキャンします——ファイルはローカルで解析され、アップロードされません。',
        ],
      },
    ],
  },
  ko: {
    title: 'AI 미디어 메타데이터 완전 가이드: EXIF, XMP, C2PA, PNG tEXt, MP4를 바이트 단위로',
    desc: 'AI 플랫폼이 실제로 흔적을 남기는 곳: EXIF UserComment 속 AIGC JSON, XMP DigitalSourceType, PNG 텍스트 청크의 생성 레시피, MP4 ilst 필드와 SEI 마커.',
    lead: '거의 모든 생성 도구는 내보낸 파일에 무언가를 남깁니다. Stable Diffusion처럼 프롬프트 전체를 PNG 텍스트 청크에 대놓고 적는 경우도 있고, Gemini처럼 XMP 블록이 파일 몇 MB 뒤에 숨어 있는 경우도, C2PA처럼 암호 서명을 붙이는 경우도 있습니다. 이 글은 포맷별로 메타데이터가 어디에 있고, 어떻게 생겼고, 어떻게 읽는지 짚어갑니다. 여기 나오는 필드명과 오프셋은 모두 실제 검출기 구현에서 가져온 것입니다.',
    sections: [
      {
        h: '먼저 직관부터: 메타데이터는 파일 어디에 있나',
        ps: [
          '이미지·비디오 파일의 본질은 "픽셀/프레임 데이터 + 여러 메타데이터 컨테이너"입니다. JPEG는 세그먼트(각각 0xFF와 마커 바이트로 시작), PNG는 청크(4바이트 길이 + 4바이트 타입명 + 데이터 + CRC), MP4/MOV는 중첩된 박스를 씁니다. 이걸 이해하면 "스크린샷은 왜 모든 메타데이터를 지우는가"가 자명해집니다. 스크린샷은 화면 픽셀만 캡처해 완전히 새로운 파일로 재인코딩하므로, 원본의 세그먼트·청크·박스는 따라올 기회조차 없습니다.',
        ],
      },
      {
        h: 'EXIF: 가장 오래됐고, 가장 위조하기 쉽다',
        ps: [
          'AI 검출과 관련된 필드: Software(처리 도구명), Make/Model(실제 사진엔 거의 항상 있고 AI 이미지엔 대개 없음), ImageDescription/UserComment(프롬프트가 들어가기도 함), Artist(일부 플랫폼이 계정 ID 해시를 기록 — 32자 이상의 16진수 문자열 자체가 약한 신호). 구현상의 함정 하나: UserComment의 앞 8바이트는 문자 인코딩 식별자(예: ASCII\\0\\0\\0)라서, 건너뛰지 않고 디코딩하면 깨진 문자만 보입니다.',
          '최근 주목할 것은 중국 플랫폼의 AIGC 라벨입니다. 중국 AI 콘텐츠 표식 규정의 암묵적 표식 요건에 따라 일부 플랫폼은 UserComment에 JSON을 기록합니다. Label이 "1"이면 AI 생성 선언이고, ContentProducer는 플랫폼을 역추적할 수 있는 등록 코드입니다(001191110000802100433B로 시작하면 통이 Qwen). 역방향 휴리스틱도 유효합니다: Software가 AI 도구와 일치하면서 FocalLength, FNumber, ExposureTime 등 십여 개 촬영 필드가 하나도 없다면 판단은 더 단단해집니다.',
        ],
      },
      {
        h: 'XMP와 PNG 텍스트 청크',
        ps: [
          'XMP는 <x:xmpmeta>로 감싼 RDF/XML입니다. 핵심 속성: Iptc4xmpExt:DigitalSourceType(trainedAlgorithmicMedia가 표준 AI 선언), xmp:CreatorTool(Midjourney 등이 기록), photoshop:Credit(Google 계열 이미지에서 "Made with Google AI"가 흔함). 실전 경고: XMP가 파일 앞부분에 있다고 가정하지 마세요. Gemini 이미지에서 XMP가 몇 MB 뒤에 있던 사례가 있어, 스캔 윈도는 10MB로 잡는 것이 안전합니다.',
          'PNG 텍스트 청크(tEXt/iTXt/zTXt)는 오픈소스 생성 생태계의 "호적부"입니다. AUTOMATIC1111은 parameters 키에 긍·부정 프롬프트, Steps, Sampler, CFG, Seed, 모델 해시를 모두 기록하고, ComfyUI는 workflow 키에 노드 그래프 전체를 JSON으로 저장합니다(끌어다 놓으면 그대로 재현 가능). InvokeAI는 invokeai_metadata를 씁니다. 여기서 잡히면 결정적 증거입니다 — 사진에 샘플러 설정이 들어갈 리 없으니까요. 다만 JPEG로 "다른 이름으로 저장" 한 번, 혹은 텍스트 청크를 보존하지 않는 도구를 한 번 거치면 전부 사라집니다.',
        ],
      },
      {
        h: 'MP4 / MOV: 비디오 컨테이너의 세 가지 단서',
        ps: [
          '비디오 메타데이터는 moov → udta → meta → ilst 박스 트리를 따릅니다. 확인할 것은 세 가지. 도구 필드: ©too, ©swr, encoder, tool, software 값이 알려진 AI 도구와 일치하면 중간 강도 신호입니다(일부 Veo 출력물의 ©too에는 달랑 "Google"만 들어 있음). AIGC 라벨: 중국 플랫폼은 ilst에 AIGC 키로 JSON 항목을 기록하며 ContentProducer로 역추적할 수 있습니다(001191330106MA2CFLDG4R10001은 통이완샹 Wan). SEI 마커: H.264/H.265 비트스트림 내부의 ASCII 도구 태그(kling-ai, sora, runway, pika-labs, luma-ai 등)로, 컨테이너가 아닌 스트림에 있어 재먹싱으로는 못 지우지만 재인코딩하면 사라집니다. C2PA도 MP4에 실릴 수 있고(uuid 박스), Sora 일부 출력물이 해당합니다.',
        ],
      },
      {
        h: '직접 읽어 보기',
        ps: [
          '대부분은 ExifTool 하나로 됩니다. exiftool -a -G1 -s 로 전체 메타데이터를 출처별로 나열, exiftool -b -UserComment 로 AIGC JSON 원문 덤프, exiftool -xmp -b 로 XMP 패킷 추출. C2PA는 공식 c2patool이나 contentcredentials.org/verify 로 서명 체인 완전 검증이 가능합니다. 설치 없이 빠르게 훑고 싶다면 이 사이트가 위의 모든 위치를 브라우저 안에서 스캔합니다 — 파일은 로컬에서 해석되며 업로드되지 않습니다.',
        ],
      },
    ],
  },
  de: {
    title: 'Der AI-Medienmetadaten-Guide: EXIF, XMP, C2PA, PNG tEXt und MP4, Byte für Byte',
    desc: 'Wo AI-Plattformen ihre Spuren wirklich hinterlassen: das AIGC-JSON im EXIF UserComment, XMP DigitalSourceType, komplette Generierungsrezepte in PNG-Textchunks, MP4-ilst-Felder und SEI-Marker.',
    lead: 'Fast jeder Generator hinterlässt etwas in seinen exportierten Dateien. Manche sind direkt — Stable Diffusion stopft den kompletten Prompt in einen PNG-Textchunk. Manche verstecken es tief — Geminis XMP-Block kann mehrere Megabyte weit in der Datei sitzen. Manche signieren kryptografisch (C2PA). Dieser Guide geht Format für Format durch: wo die Metadaten liegen, wie sie aussehen, wie man sie liest. Jeder Feldname und Offset stammt aus einer realen Detektor-Implementierung.',
    sections: [
      {
        h: 'Zuerst eine Intuition: Wo Metadaten in einer Datei wohnen',
        ps: [
          'Eine Bild- oder Videodatei ist im Kern „Pixel-/Frame-Daten plus eine Reihe von Metadaten-Containern". JPEG nutzt Segmente, jedes beginnt mit 0xFF und einem Markerbyte; PNG nutzt Chunks — 4 Byte Länge, 4 Byte Typname, Daten, CRC; MP4/MOV nutzt verschachtelte Boxen. Mit diesem Bild beantwortet sich „Warum löschen Screenshots alle Metadaten" von selbst: Ein Screenshot erfasst nur Bildschirmpixel und kodiert sie in eine brandneue Datei — die ursprünglichen Segmente, Chunks und Boxen kommen nie mit.',
        ],
      },
      {
        h: 'EXIF: das älteste Format, am leichtesten zu fälschen',
        ps: [
          'Die AI-relevanten Felder: Software (Name des Verarbeitungswerkzeugs), Make/Model (echte Fotos haben sie fast immer, AI-Bilder meist nicht), ImageDescription/UserComment (können Prompts enthalten) und Artist (manche Plattformen schreiben einen Account-ID-Hash — ein Hex-String mit 32+ Zeichen ist selbst ein schwaches Signal). Eine Implementierungsfalle: Die ersten 8 Bytes von UserComment sind ein Zeichencode-Präfix (z. B. ASCII\\0\\0\\0); dekodiert man ohne es zu überspringen, kommt Datenmüll heraus.',
          'Wissenswert: das chinesische AIGC-Label. Nach Chinas Kennzeichnungsregeln für AI-Inhalte schreiben manche Plattformen ein JSON-Objekt in UserComment, dessen Label "1" AI-Generierung erklärt und dessen ContentProducer ein zur Plattform rückverfolgbarer Registrierungscode ist (Codes mit Präfix 001191110000802100433B gehören zu Qwen). Und eine umgekehrte Heuristik: Trifft Software auf ein AI-Tool und fehlt zugleich das gute Dutzend Kamerafelder (FocalLength, FNumber, ExposureTime, ISO …) komplett, wird die Einschätzung belastbarer.',
        ],
      },
      {
        h: 'XMP und PNG-Textchunks',
        ps: [
          'XMP ist RDF/XML, eingefasst in <x:xmpmeta>. Die Schlüsselproperties: Iptc4xmpExt:DigitalSourceType (trainedAlgorithmicMedia ist die Standard-AI-Erklärung), xmp:CreatorTool (u. a. von Midjourney geschrieben) und photoshop:Credit („Made with Google AI" ist bei Google-Bildern üblich). Eine praxiserprobte Warnung: Nicht annehmen, XMP sitze nahe dem Dateianfang — bei Gemini-Bildern lag das XMP schon mehrere Megabyte tief; das Scanfenster sollte 10 MB betragen.',
          'PNG-Textchunks (tEXt/iTXt/zTXt) sind das Familienregister des Open-Source-Ökosystems: AUTOMATIC1111 schreibt positive und negative Prompts, Steps, Sampler, CFG, Seed und Modell-Hash in den parameters-Schlüssel; ComfyUI speichert seinen gesamten Node-Graphen als JSON unter workflow — zurückziehen und der Lauf ist reproduzierbar; InvokeAI nutzt invokeai_metadata. Ein Treffer hier ist ein rauchender Colt — kein Foto enthält Sampler-Einstellungen. Aber ein „Als JPEG speichern" oder ein Tool, das Textchunks verwirft, und alles ist weg.',
        ],
      },
      {
        h: 'MP4 / MOV: drei Arten von Spuren im Videocontainer',
        ps: [
          'Videometadaten folgen dem Boxbaum moov → udta → meta → ilst. Drei Dinge prüfen. Werkzeugfelder: Treffen ©too, ©swr, encoder, tool oder software auf ein bekanntes AI-Tool, ist das ein mittelstarkes Signal (manche Veo-Exporte tragen ein nacktes „Google" in ©too). Das AIGC-Label: Chinesische Plattformen schreiben einen ilst-Eintrag mit Schlüssel AIGC und JSON-Inhalt, dessen ContentProducer rückverfolgbar ist (001191330106MA2CFLDG4R10001 gehört zu Wan). SEI-Marker: ASCII-Tooltags im H.264/H.265-Bitstream selbst (kling-ai, sora, runway, pika-labs, luma-ai u. a.) — sie sitzen im Stream, nicht im Container; Remuxen entfernt sie nicht, Re-Encoding schon. Auch C2PA kann in MP4 mitfahren (uuid-Box); manche Sora-Exporte tragen es.',
        ],
      },
      {
        h: 'Alles selbst auslesen',
        ps: [
          'ExifTool allein deckt das meiste ab: exiftool -a -G1 -s listet alles nach Quelle gruppiert; exiftool -b -UserComment gibt das rohe AIGC-JSON aus; exiftool -xmp -b extrahiert das XMP-Paket. Für C2PA macht das offizielle c2patool oder contentcredentials.org/verify die vollständige Signaturkettenprüfung. Und wer nur schnell durchscannen will, ohne etwas zu installieren: Diese Seite prüft alle genannten Stellen im Browser — Dateien werden lokal geparst und nie hochgeladen.',
        ],
      },
    ],
  },
  fr: {
    title: 'Le guide des métadonnées des médias IA : EXIF, XMP, C2PA, PNG tEXt et MP4, octet par octet',
    desc: 'Où les plateformes IA laissent réellement leurs traces : le JSON AIGC dans l’EXIF UserComment, XMP DigitalSourceType, les recettes complètes de génération dans les chunks texte PNG, les champs ilst MP4 et les marqueurs SEI.',
    lead: 'Presque chaque générateur laisse quelque chose dans ses fichiers exportés. Certains sans détour — Stable Diffusion fourre le prompt entier dans un chunk texte PNG. D’autres l’enfouissent profondément — le bloc XMP de Gemini peut se trouver à plusieurs mégaoctets dans le fichier. D’autres encore le signent cryptographiquement (C2PA). Ce guide parcourt chaque format : où vivent les métadonnées, à quoi elles ressemblent, comment les lire. Chaque nom de champ et offset cité provient d’une implémentation réelle de détecteur.',
    sections: [
      {
        h: 'D’abord une intuition : où vivent les métadonnées dans un fichier',
        ps: [
          'Un fichier image ou vidéo, c’est essentiellement « des données pixels/frames plus un ensemble de conteneurs de métadonnées ». JPEG utilise des segments, chacun commençant par 0xFF et un octet marqueur ; PNG utilise des chunks — longueur sur 4 octets, nom de type sur 4 octets, données, CRC ; MP4/MOV utilise des boîtes imbriquées. Une fois cela compris, « pourquoi une capture d’écran efface toutes les métadonnées » se répond tout seul : la capture ne saisit que les pixels de l’écran et les réencode dans un fichier flambant neuf — les segments, chunks et boîtes d’origine ne suivent jamais.',
        ],
      },
      {
        h: 'EXIF : le plus ancien, et le plus facile à falsifier',
        ps: [
          'Les champs pertinents pour l’IA : Software (nom de l’outil de traitement), Make/Model (presque toujours présents sur les vraies photos, généralement absents des images IA), ImageDescription/UserComment (peuvent contenir des prompts), et Artist (certaines plateformes y écrivent un hash d’identifiant de compte — une chaîne hexadécimale de 32+ caractères est en soi un signal faible). Un piège d’implémentation : les 8 premiers octets de UserComment sont un préfixe de code de caractères (p. ex. ASCII\\0\\0\\0) ; décoder sans le sauter donne du charabia.',
          'À connaître : le label AIGC chinois. Selon les règles chinoises d’étiquetage des contenus IA, certaines plateformes écrivent un objet JSON dans UserComment où Label "1" déclare la génération IA et où ContentProducer est un code d’enregistrement traçable jusqu’à la plateforme (les codes commençant par 001191110000802100433B correspondent à Qwen). Et une heuristique inverse : si Software correspond à un outil IA et qu’aucun de la douzaine de champs photo (FocalLength, FNumber, ExposureTime, ISO…) n’est présent, le diagnostic se renforce.',
        ],
      },
      {
        h: 'XMP et chunks texte PNG',
        ps: [
          'Le XMP est du RDF/XML enveloppé dans <x:xmpmeta>. Les propriétés clés : Iptc4xmpExt:DigitalSourceType (trainedAlgorithmicMedia est la déclaration IA standard), xmp:CreatorTool (écrit notamment par Midjourney), et photoshop:Credit (« Made with Google AI » est courant sur les images Google). Un avertissement éprouvé sur le terrain : ne supposez pas que le XMP se trouve près du début du fichier — des images Gemini ont livré leur XMP à plusieurs mégaoctets de profondeur ; donnez 10 Mo à votre fenêtre de scan.',
          'Les chunks texte PNG (tEXt/iTXt/zTXt) sont le registre d’état civil de l’écosystème open source : AUTOMATIC1111 écrit prompts positifs et négatifs, Steps, Sampler, CFG, Seed et hash du modèle dans une clé parameters ; ComfyUI stocke son graphe de nœuds entier en JSON sous workflow — on peut le réimporter et reproduire l’exécution ; InvokeAI utilise invokeai_metadata. Un résultat ici vaut preuve flagrante — aucune photographie ne contient de réglages de sampler. Mais un « enregistrer en JPEG » ou tout outil qui laisse tomber les chunks texte, et tout disparaît.',
        ],
      },
      {
        h: 'MP4 / MOV : trois types d’indices dans le conteneur vidéo',
        ps: [
          'Les métadonnées vidéo suivent l’arbre de boîtes moov → udta → meta → ilst. Trois choses à vérifier. Les champs outils : si ©too, ©swr, encoder, tool ou software correspondent à un outil IA connu, c’est un signal de force moyenne (certains exports Veo portent un simple « Google » dans ©too). Le label AIGC : les plateformes chinoises écrivent une entrée ilst à clé AIGC contenant un JSON dont le ContentProducer est traçable (001191330106MA2CFLDG4R10001 correspond à Wan). Les marqueurs SEI : des tags outils ASCII dans le bitstream H.264/H.265 lui-même (kling-ai, sora, runway, pika-labs, luma-ai et autres) — ils vivent dans le flux, pas dans le conteneur ; le remuxage ne les enlève pas, le réencodage si. Le C2PA peut aussi voyager en MP4 (boîte uuid) ; certains exports Sora le portent.',
        ],
      },
      {
        h: 'Tout lire soi-même',
        ps: [
          'ExifTool couvre l’essentiel à lui seul : exiftool -a -G1 -s liste tout, groupé par source ; exiftool -b -UserComment vide le JSON AIGC brut ; exiftool -xmp -b extrait le paquet XMP. Pour le C2PA, le c2patool officiel ou contentcredentials.org/verify fait la vérification complète de la chaîne de signature. Et pour un passage rapide sans rien installer, ce site scanne tous les emplacements ci-dessus dans votre navigateur — les fichiers sont analysés en local, jamais téléversés.',
        ],
      },
    ],
  },
  es: {
    title: 'La guía de metadatos de medios IA: EXIF, XMP, C2PA, PNG tEXt y MP4, byte a byte',
    desc: 'Dónde dejan realmente sus rastros las plataformas de IA: el JSON AIGC dentro de EXIF UserComment, XMP DigitalSourceType, recetas completas de generación en chunks de texto PNG, campos ilst de MP4 y marcadores SEI.',
    lead: 'Casi todos los generadores dejan algo en sus archivos exportados. Algunos sin rodeos — Stable Diffusion mete el prompt entero en un chunk de texto PNG. Otros lo entierran hondo — el bloque XMP de Gemini puede estar a varios megabytes dentro del archivo. Otros lo firman criptográficamente (C2PA). Esta guía recorre cada formato: dónde viven los metadatos, qué aspecto tienen y cómo leerlos. Cada nombre de campo y offset citado proviene de una implementación real de detector.',
    sections: [
      {
        h: 'Primero, una intuición: dónde viven los metadatos en un archivo',
        ps: [
          'Un archivo de imagen o video es, en esencia, «datos de píxeles/frames más un conjunto de contenedores de metadatos». JPEG usa segmentos, cada uno empieza con 0xFF y un byte marcador; PNG usa chunks — 4 bytes de longitud, 4 bytes de nombre de tipo, datos, CRC; MP4/MOV usa cajas anidadas. Con esta imagen, «por qué las capturas de pantalla borran todos los metadatos» se responde solo: una captura solo toma los píxeles de la pantalla y los reencodea en un archivo nuevo — los segmentos, chunks y cajas originales nunca viajan con él.',
        ],
      },
      {
        h: 'EXIF: el más antiguo y el más fácil de falsificar',
        ps: [
          'Los campos relevantes para IA: Software (nombre de la herramienta de procesamiento), Make/Model (las fotos reales casi siempre los tienen; las imágenes IA normalmente no), ImageDescription/UserComment (pueden contener prompts) y Artist (algunas plataformas escriben un hash del ID de cuenta — una cadena hexadecimal de 32+ caracteres es en sí una señal débil). Una trampa de implementación: los primeros 8 bytes de UserComment son un prefijo de código de caracteres (p. ej. ASCII\\0\\0\\0); decodificar sin saltarlo produce basura.',
          'Vale la pena conocer la etiqueta AIGC china. Según las reglas chinas de etiquetado de contenido IA, algunas plataformas escriben un objeto JSON en UserComment donde Label "1" declara generación por IA y ContentProducer es un código de registro rastreable hasta la plataforma (los códigos que empiezan por 001191110000802100433B corresponden a Qwen). Y una heurística inversa: si Software coincide con una herramienta IA y no aparece ninguno de la docena de campos de cámara (FocalLength, FNumber, ExposureTime, ISO…), el diagnóstico se afianza.',
        ],
      },
      {
        h: 'XMP y chunks de texto PNG',
        ps: [
          'XMP es RDF/XML envuelto en <x:xmpmeta>. Las propiedades clave: Iptc4xmpExt:DigitalSourceType (trainedAlgorithmicMedia es la declaración IA estándar), xmp:CreatorTool (lo escribe Midjourney, entre otros) y photoshop:Credit («Made with Google AI» es común en imágenes de Google). Una advertencia probada en campo: no asuma que el XMP está cerca del inicio del archivo — hay imágenes de Gemini con el XMP a varios megabytes de profundidad; dele 10 MB a su ventana de escaneo.',
          'Los chunks de texto PNG (tEXt/iTXt/zTXt) son el registro civil del ecosistema open source: AUTOMATIC1111 escribe prompts positivos y negativos, Steps, Sampler, CFG, Seed y hash del modelo en una clave parameters; ComfyUI guarda su grafo de nodos entero como JSON bajo workflow — se puede arrastrar de vuelta y reproducir la ejecución; InvokeAI usa invokeai_metadata. Un acierto aquí es prueba flagrante — ninguna fotografía contiene ajustes de sampler. Pero un «guardar como JPEG» o cualquier herramienta que descarte chunks de texto, y todo desaparece.',
        ],
      },
      {
        h: 'MP4 / MOV: tres tipos de pistas en el contenedor de video',
        ps: [
          'Los metadatos de video siguen el árbol de cajas moov → udta → meta → ilst. Tres cosas que revisar. Campos de herramienta: si ©too, ©swr, encoder, tool o software coinciden con una herramienta IA conocida, es una señal de fuerza media (algunos exports de Veo llevan un escueto «Google» en ©too). La etiqueta AIGC: las plataformas chinas escriben una entrada ilst con clave AIGC que contiene JSON cuyo ContentProducer es rastreable (001191330106MA2CFLDG4R10001 corresponde a Wan). Marcadores SEI: etiquetas ASCII de herramientas dentro del propio bitstream H.264/H.265 (kling-ai, sora, runway, pika-labs, luma-ai y otros) — viven en el flujo, no en el contenedor; el remuxado no los quita, el reencodeo sí. El C2PA también puede viajar en MP4 (caja uuid); algunos exports de Sora lo llevan.',
        ],
      },
      {
        h: 'Leerlo todo por su cuenta',
        ps: [
          'ExifTool solo cubre la mayor parte: exiftool -a -G1 -s lista todo agrupado por fuente; exiftool -b -UserComment vuelca el JSON AIGC en bruto; exiftool -xmp -b extrae el paquete XMP. Para C2PA, el c2patool oficial o contentcredentials.org/verify hace la verificación completa de la cadena de firma. Y si solo quiere un repaso rápido sin instalar nada, este sitio escanea todas las ubicaciones anteriores en su navegador — los archivos se analizan en local y nunca se suben.',
        ],
      },
    ],
  },
  'pt-BR': {
    title: 'O guia de metadados de mídia de IA: EXIF, XMP, C2PA, PNG tEXt e MP4, byte a byte',
    desc: 'Onde as plataformas de IA realmente deixam seus rastros: o JSON AIGC dentro do EXIF UserComment, XMP DigitalSourceType, receitas completas de geração em chunks de texto PNG, campos ilst do MP4 e marcadores SEI.',
    lead: 'Quase todo gerador deixa algo nos arquivos exportados. Alguns sem cerimônia — o Stable Diffusion enfia o prompt inteiro num chunk de texto PNG. Outros enterram fundo — o bloco XMP do Gemini pode estar a vários megabytes dentro do arquivo. Outros assinam criptograficamente (C2PA). Este guia percorre cada formato: onde os metadados moram, como se parecem e como lê-los. Cada nome de campo e offset citado vem de uma implementação real de detector.',
    sections: [
      {
        h: 'Primeiro, uma intuição: onde os metadados moram num arquivo',
        ps: [
          'Um arquivo de imagem ou vídeo é, em essência, "dados de pixels/frames mais um conjunto de contêineres de metadados". JPEG usa segmentos, cada um começando com 0xFF e um byte marcador; PNG usa chunks — 4 bytes de comprimento, 4 bytes de nome de tipo, dados, CRC; MP4/MOV usa caixas aninhadas. Com essa imagem, "por que capturas de tela apagam todos os metadados" se responde sozinho: a captura só pega os pixels da tela e os reencoda num arquivo novinho — os segmentos, chunks e caixas originais nunca vêm junto.',
        ],
      },
      {
        h: 'EXIF: o mais antigo e o mais fácil de forjar',
        ps: [
          'Os campos relevantes para IA: Software (nome da ferramenta de processamento), Make/Model (fotos reais quase sempre os têm; imagens de IA geralmente não), ImageDescription/UserComment (podem conter prompts) e Artist (algumas plataformas gravam um hash do ID da conta — uma string hexadecimal de 32+ caracteres é por si só um sinal fraco). Uma pegadinha de implementação: os primeiros 8 bytes do UserComment são um prefixo de código de caracteres (p. ex. ASCII\\0\\0\\0); decodificar sem pulá-lo gera lixo.',
          'Vale conhecer o rótulo AIGC chinês. Pelas regras chinesas de rotulagem de conteúdo de IA, algumas plataformas gravam um objeto JSON no UserComment em que Label "1" declara geração por IA e ContentProducer é um código de registro rastreável até a plataforma (códigos começando com 001191110000802100433B correspondem ao Qwen). E uma heurística inversa: se Software bate com uma ferramenta de IA e nenhum da dúzia de campos de câmera (FocalLength, FNumber, ExposureTime, ISO…) está presente, o diagnóstico fica mais firme.',
        ],
      },
      {
        h: 'XMP e chunks de texto PNG',
        ps: [
          'XMP é RDF/XML embrulhado em <x:xmpmeta>. As propriedades-chave: Iptc4xmpExt:DigitalSourceType (trainedAlgorithmicMedia é a declaração padrão de IA), xmp:CreatorTool (gravado pelo Midjourney, entre outros) e photoshop:Credit ("Made with Google AI" é comum em imagens do Google). Um aviso testado em campo: não presuma que o XMP fica perto do início do arquivo — já houve imagens do Gemini com o XMP a vários megabytes de profundidade; dê 10 MB à sua janela de varredura.',
          'Os chunks de texto PNG (tEXt/iTXt/zTXt) são o registro civil do ecossistema open source: o AUTOMATIC1111 grava prompts positivos e negativos, Steps, Sampler, CFG, Seed e hash do modelo numa chave parameters; o ComfyUI guarda o grafo de nós inteiro como JSON em workflow — dá para arrastar de volta e reproduzir a execução; o InvokeAI usa invokeai_metadata. Um acerto aqui é prova flagrante — nenhuma fotografia contém configurações de sampler. Mas um "salvar como JPEG" ou qualquer ferramenta que descarte chunks de texto, e tudo some.',
        ],
      },
      {
        h: 'MP4 / MOV: três tipos de pistas no contêiner de vídeo',
        ps: [
          'Os metadados de vídeo seguem a árvore de caixas moov → udta → meta → ilst. Três coisas para checar. Campos de ferramenta: se ©too, ©swr, encoder, tool ou software baterem com uma ferramenta de IA conhecida, é sinal de força média (alguns exports do Veo trazem um seco "Google" no ©too). O rótulo AIGC: plataformas chinesas gravam uma entrada ilst com chave AIGC contendo JSON cujo ContentProducer é rastreável (001191330106MA2CFLDG4R10001 corresponde ao Wan). Marcadores SEI: tags ASCII de ferramentas dentro do próprio bitstream H.264/H.265 (kling-ai, sora, runway, pika-labs, luma-ai e outros) — moram no fluxo, não no contêiner; remuxar não os remove, reencodar sim. O C2PA também pode viajar no MP4 (caixa uuid); alguns exports do Sora o carregam.',
        ],
      },
      {
        h: 'Lendo tudo por conta própria',
        ps: [
          'O ExifTool sozinho cobre a maior parte: exiftool -a -G1 -s lista tudo agrupado por origem; exiftool -b -UserComment despeja o JSON AIGC bruto; exiftool -xmp -b extrai o pacote XMP. Para C2PA, o c2patool oficial ou contentcredentials.org/verify faz a verificação completa da cadeia de assinatura. E se quiser só uma passada rápida sem instalar nada, este site varre todos os locais acima no seu navegador — os arquivos são analisados localmente e nunca enviados.',
        ],
      },
    ],
  },
};

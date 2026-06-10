// Localized full-body content for /blog/what-is-c2pa/
export default {
  'zh-TW': {
    title: 'C2PA 是什麼？AI 圖片/影片溯源標準完整解讀',
    desc: '從 JUMBF 容器、manifest 結構、COSE 簽章到 digitalSourceType 詞彙表，拆解 C2PA 的技術實作，以及它在 JPEG APP11、PNG caBX chunk、MP4 中的存放方式。',
    lead: '一般元數據（EXIF、XMP）的問題是誰都能改：一行 exiftool 指令就能把「Midjourney」改成「Canon EOS R5」。C2PA 解決的就是這個問題——它把內容來源紀錄做成帶數位簽章的 manifest 嵌進檔案，改動任何一個位元組，簽章驗證就會失敗。這讓它成為目前 AI 內容溯源裡唯一具備防竄改能力的方案。',
    sections: [
      {
        h: '它是怎麼來的',
        ps: [
          '2019 年 Adobe 發起 CAI（Content Authenticity Initiative），同期 BBC 和微軟在做面向新聞業的 Project Origin，兩邊解決的是同一個問題。2021 年初兩條技術路線合併，在 Linux 基金會旗下成立 C2PA 聯盟。創始成員包括 Adobe、Arm、BBC、Intel、Microsoft、Truepic；OpenAI、Google、Sony 後續加入，目前成員早已過百。規範完全公開，參考實作 c2pa-rs（Rust）在 GitHub 開源。',
        ],
      },
      {
        h: 'manifest 實際存在檔案的哪裡',
        ps: [
          'C2PA 資料以 JUMBF（ISO/IEC 19566-5）容器封裝，嵌入位置因格式而異。JPEG 放在 APP11 段（標記 0xFFEB）；單段上限 64KB，而帶憑證鏈的 manifest 經常超過，所以規範定義了分段機制——每段 payload 以「JP」開頭，跟著 2 位元組實例號和 4 位元組序號，讀取時要按序號重組。PNG 放在專用的 caBX chunk，chunk 自帶 4 位元組長度欄位，通常一個就裝得下。MP4/MOV 放在 uuid box，一般位於檔案頭部區域。',
        ],
      },
      {
        h: 'manifest 裡有什麼',
        ps: [
          '層級是 manifest store → manifest → claim + assertions + COSE 簽章與 X.509 憑證鏈。對 AI 檢測最有用的：claim_generator / claim_generator_info 記錄誰生成的（Google 系圖片寫的是「Google C2PA Core Generator Library」）；c2pa.actions 斷言記錄內容經歷的操作，其中 digitalSourceType 直接聲明來源類型。',
          'digitalSourceType 的取值來自 IPTC 受控詞彙表，與 AI 相關的有六個，證據強度不同：trainedAlgorithmicMedia（純 AI 生成）、compositeWithTrainedAlgorithmicMedia（AI 參與合成）、compositeSynthetic（含合成元素）為強信號；algorithmicMedia、dataDrivenMedia、trainedAlgorithmicData 語義上弱一些。',
        ],
      },
      {
        h: '誰在寫 C2PA？',
        list: [
          'OpenAI DALL-E 3 / Sora：支援，圖片自 2024 年初起帶 C2PA',
          'Adobe Firefly：創始成員，Content Credentials 全線打通',
          'Microsoft Bing Image Creator：支援',
          'Google Imagen / Gemini：部分入口支援，同時使用 SynthID 像素浮水印',
          'Midjourney：不支援，寫 XMP 替代（無簽章）',
          'Stable Diffusion / ComfyUI：預設不支援——本機生成沒有可用於簽章的平台私鑰',
          'Leica M11-P、部分 Sony 相機：反向應用，拍攝時機內簽章證明「是真照片」',
        ],
      },
      {
        h: '防竄改，不防剝離',
        ps: [
          '把 C2PA 當萬能解藥會失望。把 APP11 段或 caBX chunk 整個刪掉，檔案照常打開，紀錄無聲消失——截圖、社群平台轉碼、多數修圖軟體的「另存新檔」都會造成這種剝離。它只能證有、不能證無；覆蓋不了不合作的生成方；而且「有簽章」不等於「可信」，驗證時必須看簽章方是誰。',
          '另外要分清兩個檢測檔位：完整驗證（c2patool、contentcredentials.org/verify）會校驗 COSE 簽章與憑證鏈；快速掃描（本站瀏覽器版）在本機定位 JUMBF 區塊後做文字層級匹配，足以回答「有沒有 AI 來源聲明」，但不驗證簽章。需要法證級結論請走完整驗證。',
        ],
      },
    ],
  },
  en: {
    title: 'What Is C2PA? The Provenance Standard for AI Images and Video, Explained',
    desc: 'From the JUMBF container and manifest structure to COSE signatures and the digitalSourceType vocabulary — how C2PA works and where it physically lives in JPEG APP11, PNG caBX chunks, and MP4.',
    lead: 'The problem with ordinary metadata (EXIF, XMP) is that anyone can edit it: one exiftool command turns "Midjourney" into "Canon EOS R5". C2PA exists to fix exactly that — it embeds the content’s provenance record as a digitally signed manifest, and changing a single byte breaks the signature. That makes it the only tamper-evident option in AI content provenance today.',
    sections: [
      {
        h: 'Where it came from',
        ps: [
          'C2PA didn’t appear out of nowhere. Adobe launched the CAI (Content Authenticity Initiative) in 2019, while the BBC and Microsoft were building Project Origin for news media — two efforts solving the same problem. In early 2021 the tracks merged into the C2PA coalition under the Linux Foundation. Founding members include Adobe, Arm, BBC, Intel, Microsoft and Truepic; OpenAI, Google and Sony joined later, and membership has long passed one hundred. The spec is fully public, and the reference implementation c2pa-rs (Rust) is open source on GitHub.',
        ],
      },
      {
        h: 'Where the manifest physically lives',
        ps: [
          'C2PA data is wrapped in a JUMBF container (ISO/IEC 19566-5), and the embedding spot depends on the format — a detail most articles skip, but key to understanding detection. In JPEG it sits in APP11 segments (marker byte 0xFFEB). A JPEG segment caps at 64KB while a manifest with its certificate chain often exceeds that, so the spec defines a chunking scheme: each payload starts with "JP", followed by a 2-byte box-instance number and a 4-byte sequence number; readers must reassemble the segments in order. In PNG it lives in a dedicated caBX chunk — PNG chunks carry a 4-byte length field, so one chunk usually suffices. In MP4/MOV it goes into a uuid box, typically near the head of the file.',
        ],
      },
      {
        h: 'What’s inside a manifest',
        ps: [
          'The hierarchy is manifest store → manifest → claim + assertions + a COSE signature with an X.509 certificate chain. For AI detection the useful parts are: claim_generator / claim_generator_info — who produced the record (Google-generated images carry "Google C2PA Core Generator Library"); and the c2pa.actions assertion, whose digitalSourceType field declares the source type outright.',
          'digitalSourceType values come from the IPTC controlled vocabulary, and the six AI-related ones differ in strength: trainedAlgorithmicMedia (fully AI-generated), compositeWithTrainedAlgorithmicMedia (AI-assisted composite) and compositeSynthetic (contains synthetic elements) are strong; algorithmicMedia, dataDrivenMedia and trainedAlgorithmicData are semantically weaker.',
        ],
      },
      {
        h: 'Who actually writes C2PA?',
        list: [
          'OpenAI DALL-E 3 / Sora: yes — images carry C2PA since early 2024',
          'Adobe Firefly: founding member, Content Credentials end to end',
          'Microsoft Bing Image Creator: yes',
          'Google Imagen / Gemini: some product surfaces, alongside the SynthID pixel watermark',
          'Midjourney: no — writes XMP instead (unsigned)',
          'Stable Diffusion / ComfyUI: not by default — local generation has no platform key to sign with',
          'Leica M11-P and some Sony cameras: the reverse use case — in-camera signing to prove a photo is real',
        ],
      },
      {
        h: 'Tamper-evident, not strip-proof',
        ps: [
          'Treating C2PA as a silver bullet ends in disappointment. Delete the APP11 segments or the caBX chunk and the file opens normally — the record vanishes silently. Screenshots, social-media transcoding and most editors’ "save as" cause exactly this. It can prove presence, never absence; it cannot cover generators that opt out; and "has a signature" is not "is trustworthy" — anyone can sign a manifest with their own certificate, so verification must check who signed.',
          'Also keep the two depths of checking apart: full verification (c2patool, contentcredentials.org/verify) validates the COSE signature and certificate chain; a quick scan (what this site’s browser version does) locates the JUMBF blocks locally and does text-level matching. The quick scan answers "is there an AI provenance claim in this file"; for a forensic-grade conclusion, run full verification.',
        ],
      },
    ],
  },
  ja: {
    title: 'C2PA とは何か？AI 画像・動画の来歴標準を技術的に解説',
    desc: 'JUMBF コンテナと manifest 構造、COSE 署名、digitalSourceType 語彙まで——C2PA の仕組みと、JPEG APP11・PNG caBX チャンク・MP4 における物理的な格納場所。',
    lead: '通常のメタデータ（EXIF、XMP）の問題は誰でも編集できることです。exiftool のコマンド 1 行で「Midjourney」を「Canon EOS R5」に書き換えられます。C2PA はまさにこれを解決するために存在します。来歴記録をデジタル署名付き manifest としてファイルに埋め込み、1 バイトでも改変すれば署名検証が失敗する——AI コンテンツ来歴において改ざん検知能力を持つ唯一の方式です。',
    sections: [
      {
        h: 'C2PA の成り立ち',
        ps: [
          'C2PA は突然現れたものではありません。2019 年に Adobe が CAI（Content Authenticity Initiative）を立ち上げ、同時期に BBC と Microsoft が報道向けの Project Origin を進めていました。2021 年初頭に両者が合流し、Linux Foundation 傘下で C2PA 連合が発足。創設メンバーは Adobe、Arm、BBC、Intel、Microsoft、Truepic で、OpenAI、Google、Sony が後に加わり、加盟組織はすでに 100 を超えています。仕様は完全公開で、リファレンス実装 c2pa-rs（Rust）は GitHub でオープンソースです。',
        ],
      },
      {
        h: 'manifest はファイルのどこに格納されるか',
        ps: [
          'C2PA データは JUMBF コンテナ（ISO/IEC 19566-5）で包まれ、埋め込み位置はフォーマットごとに異なります。多くの解説記事が省略する部分ですが、検出原理の理解には欠かせません。JPEG では APP11 セグメント（マーカー 0xFFEB）に入ります。JPEG のセグメント上限は 64KB で、証明書チェーン込みの manifest はこれを超えることが多いため、仕様は分割方式を定義しています。各 payload は「JP」で始まり、2 バイトのボックスインスタンス番号と 4 バイトのシーケンス番号が続き、読み取り側は順番どおりに再結合します。PNG では専用の caBX チャンクに格納され、チャンクは 4 バイトの長さフィールドを持つため通常 1 つで収まります。MP4/MOV では uuid ボックスに入り、たいていファイル先頭付近にあります。',
        ],
      },
      {
        h: 'manifest の中身',
        ps: [
          '階層は manifest store → manifest → claim + assertions + COSE 署名（X.509 証明書チェーン付き）です。AI 検出に役立つのは、誰が記録を作ったかを示す claim_generator / claim_generator_info（Google 生成画像には「Google C2PA Core Generator Library」が入ります）と、c2pa.actions アサーション内で由来種別を直接宣言する digitalSourceType です。',
          'digitalSourceType の値は IPTC 統制語彙に由来し、AI 関連の 6 つは強度が異なります。trainedAlgorithmicMedia（完全 AI 生成）、compositeWithTrainedAlgorithmicMedia（AI 関与の合成）、compositeSynthetic（合成要素を含む）は強いシグナル。algorithmicMedia、dataDrivenMedia、trainedAlgorithmicData は意味的に弱めです。',
        ],
      },
      {
        h: '実際に C2PA を書いているのは誰か',
        list: [
          'OpenAI DALL-E 3 / Sora：対応。画像は 2024 年初頭から C2PA 付き',
          'Adobe Firefly：創設メンバー。Content Credentials を全面展開',
          'Microsoft Bing Image Creator：対応',
          'Google Imagen / Gemini：一部の入口で対応。SynthID ピクセル透かしと併用',
          'Midjourney：非対応。代わりに XMP を書く（署名なし）',
          'Stable Diffusion / ComfyUI：デフォルト非対応——ローカル生成には署名に使えるプラットフォーム秘密鍵がない',
          'Leica M11-P、一部 Sony カメラ：逆方向の応用。撮影時にカメラ内署名し「本物の写真」を証明',
        ],
      },
      {
        h: '改ざんは検知できるが、剥離は防げない',
        ps: [
          'C2PA を万能薬と考えると失望します。APP11 セグメントや caBX チャンクを丸ごと削除してもファイルは普通に開き、記録は静かに消えます。スクリーンショット、SNS のトランスコード、多くの編集ソフトの「名前を付けて保存」がまさにこれを引き起こします。存在は証明できても不在は証明できず、協力しない生成側はカバーできません。さらに「署名がある」は「信頼できる」と同義ではありません。誰でも自分の証明書で manifest に署名できるため、検証では署名者が誰かを確認する必要があります。',
          '検査の深さも 2 段階を区別してください。完全検証（c2patool、contentcredentials.org/verify）は COSE 署名と証明書チェーンを検証します。クイックスキャン（本サイトのブラウザ版）はローカルで JUMBF ブロックを特定しテキストレベルの照合を行うもので、「AI 由来の宣言があるか」には答えられますが、法科学レベルの結論が必要なら完全検証を使ってください。',
        ],
      },
    ],
  },
  ko: {
    title: 'C2PA란 무엇인가? AI 이미지·비디오 출처 표준 기술 해설',
    desc: 'JUMBF 컨테이너와 manifest 구조, COSE 서명, digitalSourceType 어휘까지 — C2PA의 작동 원리와 JPEG APP11, PNG caBX 청크, MP4에서의 물리적 저장 위치.',
    lead: '일반 메타데이터(EXIF, XMP)의 문제는 누구나 고칠 수 있다는 점입니다. exiftool 명령 한 줄이면 "Midjourney"가 "Canon EOS R5"로 바뀝니다. C2PA는 바로 이 문제를 해결합니다. 콘텐츠의 출처 기록을 디지털 서명된 manifest로 파일에 심고, 한 바이트만 바꿔도 서명 검증이 실패하게 만듭니다. 현재 AI 콘텐츠 출처 추적에서 변조 감지 능력을 갖춘 유일한 방식입니다.',
    sections: [
      {
        h: 'C2PA의 유래',
        ps: [
          'C2PA는 갑자기 등장한 것이 아닙니다. 2019년 Adobe가 CAI(Content Authenticity Initiative)를 시작했고, 같은 시기 BBC와 Microsoft는 언론용 Project Origin을 만들고 있었습니다. 같은 문제를 풀던 두 흐름이 2021년 초 합쳐져 Linux Foundation 산하 C2PA 연합이 출범했습니다. 창립 멤버는 Adobe, Arm, BBC, Intel, Microsoft, Truepic이고 OpenAI, Google, Sony가 뒤에 합류해 회원사는 이미 100곳을 훌쩍 넘었습니다. 사양은 완전히 공개돼 있으며 레퍼런스 구현 c2pa-rs(Rust)는 GitHub에 오픈소스로 있습니다.',
        ],
      },
      {
        h: 'manifest는 파일 어디에 저장되는가',
        ps: [
          'C2PA 데이터는 JUMBF 컨테이너(ISO/IEC 19566-5)로 감싸지며, 저장 위치는 포맷마다 다릅니다. 대부분의 소개 글이 건너뛰는 부분이지만 검출 원리를 이해하는 데 핵심입니다. JPEG에서는 APP11 세그먼트(마커 0xFFEB)에 들어갑니다. JPEG 세그먼트 상한은 64KB인데 인증서 체인을 포함한 manifest는 이를 넘는 경우가 많아, 사양은 분할 방식을 정의합니다. 각 payload는 "JP"로 시작하고 2바이트 박스 인스턴스 번호와 4바이트 시퀀스 번호가 이어지며, 읽는 쪽은 순서대로 재조립해야 합니다. PNG에서는 전용 caBX 청크에 저장됩니다. 청크에는 4바이트 길이 필드가 있어 보통 하나면 충분합니다. MP4/MOV에서는 uuid 박스에 들어가며 대개 파일 앞부분에 있습니다.',
        ],
      },
      {
        h: 'manifest 안에는 무엇이 있나',
        ps: [
          '계층 구조는 manifest store → manifest → claim + assertions + COSE 서명(X.509 인증서 체인 포함)입니다. AI 검출에 유용한 것은 기록 작성 주체를 나타내는 claim_generator / claim_generator_info(Google 생성 이미지에는 "Google C2PA Core Generator Library"가 들어감)와, c2pa.actions 어서션 안에서 출처 유형을 직접 선언하는 digitalSourceType입니다.',
          'digitalSourceType 값은 IPTC 통제 어휘에서 오며, AI 관련 6개 값은 증거 강도가 다릅니다. trainedAlgorithmicMedia(완전 AI 생성), compositeWithTrainedAlgorithmicMedia(AI가 참여한 합성), compositeSynthetic(합성 요소 포함)은 강한 신호이고, algorithmicMedia, dataDrivenMedia, trainedAlgorithmicData는 의미상 약한 편입니다.',
        ],
      },
      {
        h: '실제로 C2PA를 쓰는 곳',
        list: [
          'OpenAI DALL-E 3 / Sora: 지원 — 이미지는 2024년 초부터 C2PA 포함',
          'Adobe Firefly: 창립 멤버, Content Credentials 전면 적용',
          'Microsoft Bing Image Creator: 지원',
          'Google Imagen / Gemini: 일부 제품 입구에서 지원, SynthID 픽셀 워터마크와 병행',
          'Midjourney: 미지원 — 대신 XMP 기록(서명 없음)',
          'Stable Diffusion / ComfyUI: 기본 미지원 — 로컬 생성에는 서명에 쓸 플랫폼 개인키가 없음',
          'Leica M11-P, 일부 Sony 카메라: 역방향 활용 — 촬영 시 카메라 내 서명으로 "진짜 사진"임을 증명',
        ],
      },
      {
        h: '변조는 감지하지만, 제거는 막지 못한다',
        ps: [
          'C2PA를 만능 해결책으로 여기면 실망하게 됩니다. APP11 세그먼트나 caBX 청크를 통째로 지워도 파일은 멀쩡히 열리고 기록만 조용히 사라집니다. 스크린샷, SNS 트랜스코딩, 대부분의 편집기 "다른 이름으로 저장"이 정확히 이런 제거를 일으킵니다. 존재는 증명해도 부재는 증명할 수 없고, 협조하지 않는 생성 도구는 커버하지 못합니다. 또한 "서명이 있다"가 "신뢰할 수 있다"는 뜻은 아닙니다. 누구나 자기 인증서로 manifest에 서명할 수 있으므로, 검증할 때는 서명 주체가 누구인지 확인해야 합니다.',
          '검사 깊이도 두 단계를 구분하세요. 완전 검증(c2patool, contentcredentials.org/verify)은 COSE 서명과 인증서 체인을 검증합니다. 빠른 스캔(이 사이트 브라우저 버전)은 로컬에서 JUMBF 블록을 찾아 텍스트 수준 매칭을 합니다. 빠른 스캔은 "이 파일에 AI 출처 선언이 있는가"에 답하며, 법의학 수준의 결론이 필요하면 완전 검증을 사용해야 합니다.',
        ],
      },
    ],
  },
  de: {
    title: 'Was ist C2PA? Der Herkunftsstandard für AI-Bilder und -Videos, technisch erklärt',
    desc: 'Vom JUMBF-Container über die Manifest-Struktur bis zu COSE-Signaturen und dem digitalSourceType-Vokabular — wie C2PA funktioniert und wo es in JPEG APP11, PNG caBX-Chunks und MP4 physisch liegt.',
    lead: 'Das Problem gewöhnlicher Metadaten (EXIF, XMP): Jeder kann sie ändern. Ein exiftool-Befehl macht aus „Midjourney" ein „Canon EOS R5". Genau das löst C2PA — es bettet das Herkunftsprotokoll als digital signiertes Manifest in die Datei ein, und schon ein verändertes Byte lässt die Signaturprüfung fehlschlagen. Damit ist es heute die einzige manipulationssichere Option in der AI-Inhaltsherkunft.',
    sections: [
      {
        h: 'Woher es kommt',
        ps: [
          'C2PA kam nicht aus dem Nichts. Adobe startete 2019 die CAI (Content Authenticity Initiative), während BBC und Microsoft mit Project Origin dasselbe Problem für den Journalismus angingen. Anfang 2021 verschmolzen beide Stränge zur C2PA-Koalition unter der Linux Foundation. Gründungsmitglieder sind Adobe, Arm, BBC, Intel, Microsoft und Truepic; OpenAI, Google und Sony kamen später dazu, die Mitgliederzahl liegt längst über hundert. Die Spezifikation ist vollständig öffentlich, die Referenzimplementierung c2pa-rs (Rust) ist auf GitHub quelloffen.',
        ],
      },
      {
        h: 'Wo das Manifest physisch liegt',
        ps: [
          'C2PA-Daten stecken in einem JUMBF-Container (ISO/IEC 19566-5); der Einbettungsort hängt vom Format ab — ein Detail, das die meisten Artikel überspringen, das aber für das Verständnis der Erkennung zentral ist. In JPEG sitzen sie in APP11-Segmenten (Markerbyte 0xFFEB). Ein JPEG-Segment ist auf 64 KB begrenzt, ein Manifest mit Zertifikatskette überschreitet das oft; die Spezifikation definiert deshalb ein Stückelungsschema: Jede Payload beginnt mit „JP", gefolgt von einer 2-Byte-Box-Instanznummer und einer 4-Byte-Sequenznummer — Leser müssen die Segmente der Reihe nach wieder zusammensetzen. In PNG liegt es in einem eigenen caBX-Chunk; PNG-Chunks tragen ein 4-Byte-Längenfeld, ein Chunk genügt daher meist. In MP4/MOV wandert es in eine uuid-Box, typischerweise nahe dem Dateianfang.',
        ],
      },
      {
        h: 'Was im Manifest steht',
        ps: [
          'Die Hierarchie lautet Manifest Store → Manifest → Claim + Assertions + COSE-Signatur mit X.509-Zertifikatskette. Für die AI-Erkennung sind nützlich: claim_generator / claim_generator_info — wer das Protokoll erzeugt hat (Google-generierte Bilder tragen „Google C2PA Core Generator Library"); und die c2pa.actions-Assertion, deren digitalSourceType-Feld den Quelltyp direkt deklariert.',
          'Die digitalSourceType-Werte stammen aus dem kontrollierten IPTC-Vokabular; die sechs AI-bezogenen unterscheiden sich in der Beweiskraft: trainedAlgorithmicMedia (vollständig AI-generiert), compositeWithTrainedAlgorithmicMedia (AI-gestützte Montage) und compositeSynthetic (enthält synthetische Elemente) sind stark; algorithmicMedia, dataDrivenMedia und trainedAlgorithmicData semantisch schwächer.',
        ],
      },
      {
        h: 'Wer schreibt tatsächlich C2PA?',
        list: [
          'OpenAI DALL-E 3 / Sora: ja — Bilder tragen C2PA seit Anfang 2024',
          'Adobe Firefly: Gründungsmitglied, Content Credentials durchgängig',
          'Microsoft Bing Image Creator: ja',
          'Google Imagen / Gemini: einige Produktoberflächen, parallel zum SynthID-Pixelwasserzeichen',
          'Midjourney: nein — schreibt stattdessen XMP (unsigniert)',
          'Stable Diffusion / ComfyUI: standardmäßig nicht — lokale Generierung hat keinen Plattformschlüssel zum Signieren',
          'Leica M11-P und einige Sony-Kameras: der umgekehrte Fall — Signierung in der Kamera als Echtheitsbeleg',
        ],
      },
      {
        h: 'Manipulationssicher, aber nicht entfernungssicher',
        ps: [
          'Wer C2PA für ein Allheilmittel hält, wird enttäuscht. Löscht man die APP11-Segmente oder den caBX-Chunk komplett, öffnet sich die Datei normal — das Protokoll verschwindet lautlos. Screenshots, Social-Media-Transcoding und das „Speichern unter" der meisten Editoren bewirken genau das. C2PA kann Anwesenheit beweisen, niemals Abwesenheit; Generatoren, die nicht mitmachen, deckt es nicht ab; und „hat eine Signatur" heißt nicht „ist vertrauenswürdig" — jeder kann ein Manifest mit eigenem Zertifikat signieren, die Prüfung muss also klären, wer signiert hat.',
          'Außerdem die zwei Prüftiefen auseinanderhalten: Die vollständige Verifikation (c2patool, contentcredentials.org/verify) validiert COSE-Signatur und Zertifikatskette; der Schnellscan (die Browser-Version dieser Seite) lokalisiert die JUMBF-Blöcke lokal und macht Textabgleich. Der Schnellscan beantwortet „enthält diese Datei eine AI-Herkunftserklärung" — für ein forensisch belastbares Ergebnis braucht es die vollständige Verifikation.',
        ],
      },
    ],
  },
  fr: {
    title: 'C2PA, c’est quoi ? Le standard de provenance des images et vidéos IA, expliqué',
    desc: 'Du conteneur JUMBF à la structure du manifest, des signatures COSE au vocabulaire digitalSourceType — comment fonctionne C2PA et où il se loge physiquement dans JPEG APP11, les chunks PNG caBX et MP4.',
    lead: 'Le problème des métadonnées ordinaires (EXIF, XMP) : n’importe qui peut les modifier. Une commande exiftool transforme « Midjourney » en « Canon EOS R5 ». C2PA existe pour régler exactement cela — il embarque le registre de provenance sous forme de manifest signé numériquement, et la modification d’un seul octet casse la signature. C’est aujourd’hui la seule option inviolable en matière de provenance de contenus IA.',
    sections: [
      {
        h: 'D’où ça vient',
        ps: [
          'C2PA n’est pas sorti de nulle part. Adobe a lancé la CAI (Content Authenticity Initiative) en 2019, pendant que la BBC et Microsoft construisaient Project Origin pour les médias — deux efforts sur le même problème. Début 2021, les deux pistes ont fusionné dans la coalition C2PA sous l’égide de la Linux Foundation. Membres fondateurs : Adobe, Arm, BBC, Intel, Microsoft et Truepic ; OpenAI, Google et Sony ont rejoint ensuite, et les membres dépassent largement la centaine. La spécification est entièrement publique et l’implémentation de référence c2pa-rs (Rust) est open source sur GitHub.',
        ],
      },
      {
        h: 'Où le manifest se loge physiquement',
        ps: [
          'Les données C2PA sont encapsulées dans un conteneur JUMBF (ISO/IEC 19566-5), et l’emplacement dépend du format — un détail que la plupart des articles passent sous silence, pourtant essentiel pour comprendre la détection. En JPEG, elles occupent des segments APP11 (octet marqueur 0xFFEB). Un segment JPEG plafonne à 64 Ko alors qu’un manifest avec sa chaîne de certificats le dépasse souvent ; la spécification définit donc un découpage : chaque payload commence par « JP », suivi d’un numéro d’instance de boîte sur 2 octets et d’un numéro de séquence sur 4 octets — le lecteur doit réassembler les segments dans l’ordre. En PNG, il vit dans un chunk dédié caBX ; les chunks PNG portant un champ de longueur de 4 octets, un seul suffit en général. En MP4/MOV, il va dans une boîte uuid, généralement près du début du fichier.',
        ],
      },
      {
        h: 'Ce que contient un manifest',
        ps: [
          'La hiérarchie : manifest store → manifest → claim + assertions + signature COSE avec chaîne de certificats X.509. Pour la détection IA, l’utile est : claim_generator / claim_generator_info — qui a produit le registre (les images générées par Google portent « Google C2PA Core Generator Library ») ; et l’assertion c2pa.actions, dont le champ digitalSourceType déclare directement le type de source.',
          'Les valeurs de digitalSourceType viennent du vocabulaire contrôlé IPTC ; les six liées à l’IA n’ont pas la même force : trainedAlgorithmicMedia (entièrement généré par IA), compositeWithTrainedAlgorithmicMedia (composite assisté par IA) et compositeSynthetic (éléments synthétiques) sont fortes ; algorithmicMedia, dataDrivenMedia et trainedAlgorithmicData sont sémantiquement plus faibles.',
        ],
      },
      {
        h: 'Qui écrit réellement du C2PA ?',
        list: [
          'OpenAI DALL-E 3 / Sora : oui — les images portent du C2PA depuis début 2024',
          'Adobe Firefly : membre fondateur, Content Credentials de bout en bout',
          'Microsoft Bing Image Creator : oui',
          'Google Imagen / Gemini : certaines surfaces produit, en parallèle du filigrane pixel SynthID',
          'Midjourney : non — écrit du XMP à la place (non signé)',
          'Stable Diffusion / ComfyUI : pas par défaut — la génération locale n’a aucune clé de plateforme pour signer',
          'Leica M11-P et certains Sony : le cas inverse — signature dans l’appareil pour prouver qu’une photo est vraie',
        ],
      },
      {
        h: 'Inviolable, mais pas indéracinable',
        ps: [
          'Prendre C2PA pour une solution miracle mène à la déception. Supprimez les segments APP11 ou le chunk caBX en bloc : le fichier s’ouvre normalement, le registre disparaît en silence. Captures d’écran, transcodage des réseaux sociaux et « enregistrer sous » de la plupart des éditeurs produisent exactement cela. Il prouve la présence, jamais l’absence ; il ne couvre pas les générateurs qui s’abstiennent ; et « porte une signature » ne veut pas dire « digne de confiance » — n’importe qui peut signer un manifest avec son propre certificat, la vérification doit donc établir qui a signé.',
          'Distinguez aussi les deux profondeurs de contrôle : la vérification complète (c2patool, contentcredentials.org/verify) valide la signature COSE et la chaîne de certificats ; le scan rapide (la version navigateur de ce site) localise les blocs JUMBF en local et fait une correspondance textuelle. Le scan rapide répond à « ce fichier contient-il une déclaration de provenance IA » ; pour une conclusion de niveau forensique, passez par la vérification complète.',
        ],
      },
    ],
  },
  es: {
    title: '¿Qué es C2PA? El estándar de procedencia para imágenes y videos de IA, explicado',
    desc: 'Del contenedor JUMBF y la estructura del manifest a las firmas COSE y el vocabulario digitalSourceType: cómo funciona C2PA y dónde vive físicamente en JPEG APP11, los chunks PNG caBX y MP4.',
    lead: 'El problema de los metadatos comunes (EXIF, XMP) es que cualquiera puede editarlos: un comando de exiftool convierte "Midjourney" en "Canon EOS R5". C2PA existe para resolver exactamente eso: incrusta el registro de procedencia como un manifest firmado digitalmente, y cambiar un solo byte rompe la firma. Eso lo convierte hoy en la única opción a prueba de manipulación en la procedencia de contenidos de IA.',
    sections: [
      {
        h: 'De dónde viene',
        ps: [
          'C2PA no apareció de la nada. Adobe lanzó la CAI (Content Authenticity Initiative) en 2019, mientras la BBC y Microsoft construían Project Origin para los medios: dos esfuerzos sobre el mismo problema. A comienzos de 2021 ambas vías se fusionaron en la coalición C2PA bajo la Linux Foundation. Los miembros fundadores son Adobe, Arm, BBC, Intel, Microsoft y Truepic; OpenAI, Google y Sony se sumaron después, y los miembros superan de sobra el centenar. La especificación es totalmente pública y la implementación de referencia c2pa-rs (Rust) es código abierto en GitHub.',
        ],
      },
      {
        h: 'Dónde vive físicamente el manifest',
        ps: [
          'Los datos C2PA van envueltos en un contenedor JUMBF (ISO/IEC 19566-5), y el lugar de incrustación depende del formato — un detalle que la mayoría de los artículos omite, pero clave para entender la detección. En JPEG ocupa segmentos APP11 (byte marcador 0xFFEB). Un segmento JPEG tiene tope de 64 KB y un manifest con su cadena de certificados suele excederlo, así que la especificación define un troceado: cada payload empieza con "JP", seguido de un número de instancia de caja de 2 bytes y un número de secuencia de 4 bytes; el lector debe reensamblar los segmentos en orden. En PNG vive en un chunk dedicado caBX; los chunks PNG llevan un campo de longitud de 4 bytes, así que uno suele bastar. En MP4/MOV va en una caja uuid, normalmente cerca del inicio del archivo.',
        ],
      },
      {
        h: 'Qué hay dentro de un manifest',
        ps: [
          'La jerarquía es manifest store → manifest → claim + assertions + firma COSE con cadena de certificados X.509. Para la detección de IA lo útil es: claim_generator / claim_generator_info — quién produjo el registro (las imágenes generadas por Google llevan "Google C2PA Core Generator Library"); y la assertion c2pa.actions, cuyo campo digitalSourceType declara el tipo de fuente directamente.',
          'Los valores de digitalSourceType provienen del vocabulario controlado de IPTC; los seis relacionados con IA difieren en fuerza: trainedAlgorithmicMedia (totalmente generado por IA), compositeWithTrainedAlgorithmicMedia (composición asistida por IA) y compositeSynthetic (contiene elementos sintéticos) son fuertes; algorithmicMedia, dataDrivenMedia y trainedAlgorithmicData son semánticamente más débiles.',
        ],
      },
      {
        h: '¿Quién escribe C2PA en la práctica?',
        list: [
          'OpenAI DALL-E 3 / Sora: sí — las imágenes llevan C2PA desde comienzos de 2024',
          'Adobe Firefly: miembro fundador, Content Credentials de punta a punta',
          'Microsoft Bing Image Creator: sí',
          'Google Imagen / Gemini: algunas superficies de producto, junto con la marca de agua de píxeles SynthID',
          'Midjourney: no — escribe XMP en su lugar (sin firma)',
          'Stable Diffusion / ComfyUI: no por defecto — la generación local no tiene clave de plataforma con la que firmar',
          'Leica M11-P y algunas cámaras Sony: el caso inverso — firma en cámara para demostrar que una foto es real',
        ],
      },
      {
        h: 'A prueba de manipulación, no de eliminación',
        ps: [
          'Tratar C2PA como bala de plata termina en decepción. Borre los segmentos APP11 o el chunk caBX completos y el archivo se abre con normalidad: el registro desaparece en silencio. Capturas de pantalla, transcodificación de redes sociales y el "guardar como" de la mayoría de los editores causan exactamente eso. Puede probar presencia, nunca ausencia; no cubre a los generadores que se abstienen; y "tiene firma" no es "es confiable": cualquiera puede firmar un manifest con su propio certificado, así que la verificación debe comprobar quién firmó.',
          'Distinga además las dos profundidades de revisión: la verificación completa (c2patool, contentcredentials.org/verify) valida la firma COSE y la cadena de certificados; el escaneo rápido (lo que hace la versión de navegador de este sitio) localiza los bloques JUMBF en local y hace coincidencia a nivel de texto. El escaneo rápido responde "¿hay una declaración de procedencia IA en este archivo?"; para una conclusión de grado forense, ejecute la verificación completa.',
        ],
      },
    ],
  },
  'pt-BR': {
    title: 'O que é C2PA? O padrão de procedência para imagens e vídeos de IA, explicado',
    desc: 'Do contêiner JUMBF e da estrutura do manifest às assinaturas COSE e ao vocabulário digitalSourceType: como o C2PA funciona e onde ele mora fisicamente no JPEG APP11, nos chunks PNG caBX e no MP4.',
    lead: 'O problema dos metadados comuns (EXIF, XMP) é que qualquer um pode editá-los: um comando do exiftool transforma "Midjourney" em "Canon EOS R5". O C2PA existe para resolver exatamente isso — ele embute o registro de procedência como um manifest assinado digitalmente, e alterar um único byte quebra a assinatura. Isso o torna hoje a única opção à prova de adulteração na procedência de conteúdo de IA.',
    sections: [
      {
        h: 'De onde veio',
        ps: [
          'O C2PA não surgiu do nada. A Adobe lançou a CAI (Content Authenticity Initiative) em 2019, enquanto BBC e Microsoft construíam o Project Origin para o jornalismo — dois esforços sobre o mesmo problema. No início de 2021 as duas trilhas se fundiram na coalizão C2PA sob a Linux Foundation. Os membros fundadores são Adobe, Arm, BBC, Intel, Microsoft e Truepic; OpenAI, Google e Sony entraram depois, e o número de membros já passou bem de cem. A especificação é totalmente pública e a implementação de referência c2pa-rs (Rust) é open source no GitHub.',
        ],
      },
      {
        h: 'Onde o manifest mora fisicamente',
        ps: [
          'Os dados C2PA são encapsulados em um contêiner JUMBF (ISO/IEC 19566-5), e o local de incorporação depende do formato — um detalhe que a maioria dos artigos pula, mas essencial para entender a detecção. No JPEG, ficam em segmentos APP11 (byte marcador 0xFFEB). Um segmento JPEG tem teto de 64 KB e um manifest com cadeia de certificados costuma ultrapassá-lo, então a especificação define um fatiamento: cada payload começa com "JP", seguido de um número de instância de caixa de 2 bytes e um número de sequência de 4 bytes; o leitor precisa remontar os segmentos na ordem. No PNG, mora em um chunk dedicado caBX; chunks PNG carregam um campo de comprimento de 4 bytes, então um só costuma bastar. No MP4/MOV, vai para uma caixa uuid, geralmente perto do início do arquivo.',
        ],
      },
      {
        h: 'O que há dentro de um manifest',
        ps: [
          'A hierarquia é manifest store → manifest → claim + assertions + assinatura COSE com cadeia de certificados X.509. Para detecção de IA, o útil é: claim_generator / claim_generator_info — quem produziu o registro (imagens geradas pelo Google trazem "Google C2PA Core Generator Library"); e a assertion c2pa.actions, cujo campo digitalSourceType declara o tipo de fonte diretamente.',
          'Os valores de digitalSourceType vêm do vocabulário controlado da IPTC; os seis ligados à IA diferem em força: trainedAlgorithmicMedia (totalmente gerado por IA), compositeWithTrainedAlgorithmicMedia (composição com participação de IA) e compositeSynthetic (contém elementos sintéticos) são fortes; algorithmicMedia, dataDrivenMedia e trainedAlgorithmicData são semanticamente mais fracos.',
        ],
      },
      {
        h: 'Quem escreve C2PA na prática?',
        list: [
          'OpenAI DALL-E 3 / Sora: sim — imagens trazem C2PA desde o início de 2024',
          'Adobe Firefly: membro fundador, Content Credentials de ponta a ponta',
          'Microsoft Bing Image Creator: sim',
          'Google Imagen / Gemini: algumas superfícies de produto, junto com a marca-d’água de pixels SynthID',
          'Midjourney: não — grava XMP no lugar (sem assinatura)',
          'Stable Diffusion / ComfyUI: não por padrão — a geração local não tem chave de plataforma para assinar',
          'Leica M11-P e algumas câmeras Sony: o caso inverso — assinatura na câmera para provar que a foto é real',
        ],
      },
      {
        h: 'À prova de adulteração, não de remoção',
        ps: [
          'Tratar o C2PA como bala de prata termina em decepção. Apague os segmentos APP11 ou o chunk caBX inteiros e o arquivo abre normalmente — o registro some em silêncio. Capturas de tela, transcodificação de redes sociais e o "salvar como" da maioria dos editores causam exatamente isso. Ele prova presença, nunca ausência; não cobre geradores que ficam de fora; e "tem assinatura" não é "é confiável" — qualquer um pode assinar um manifest com o próprio certificado, então a verificação precisa checar quem assinou.',
          'Separe também as duas profundidades de checagem: a verificação completa (c2patool, contentcredentials.org/verify) valida a assinatura COSE e a cadeia de certificados; a varredura rápida (o que a versão de navegador deste site faz) localiza os blocos JUMBF localmente e faz correspondência em nível de texto. A varredura rápida responde "este arquivo tem uma declaração de procedência de IA?"; para uma conclusão de nível forense, rode a verificação completa.',
        ],
      },
    ],
  },
};

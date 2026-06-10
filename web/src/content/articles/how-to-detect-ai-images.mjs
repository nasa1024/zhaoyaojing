// Localized full-body content for /blog/how-to-detect-ai-images/
// Technical facts mirror the zh-CN article and the detector implementation in src/.
export default {
  'zh-TW': {
    title: '如何判斷一張圖片是否 AI 生成？先查檔案，再看畫面',
    desc: '拿到可疑圖片後的完整排查流程：先讀 C2PA、XMP、PNG 文字塊和 EXIF 裡的來源信號，再做視覺檢查與分類器交叉驗證，並講清每種方法的可信邊界。',
    lead: '拿到一張可疑的圖，多數人的直覺是放大畫面找破綻。其實更快的第一步是查檔案本身：生成工具往往把自己的名字明明白白寫進了檔案，幾秒鐘就能讀出來。這篇按「先查檔案、再看畫面、最後交叉驗證」的順序走一遍，並誠實說明每種方法到哪裡就不靈了。',
    sections: [
      {
        h: '元數據：最接近實錘的證據',
        ps: [
          '生成工具會在四個地方留痕。C2PA manifest（DALL-E 3、Firefly、Gemini/Imagen）帶數位簽章，其中 digitalSourceType=trainedAlgorithmicMedia 是最強的 AI 來源聲明；XMP 裡常見 Midjourney 寫入的 CreatorTool，或 Google 系圖片的 Credit="Made with Google AI"；PNG 文字塊是 Stable Diffusion WebUI 的「戶口本」——提示詞、Steps、Sampler、CFG、Seed、模型雜湊一應俱全，ComfyUI 甚至把整張節點圖 JSON 存進 workflow 塊；EXIF 的 Software 欄位會出現工具名，中國平台還會在 UserComment 裡寫入 AIGC JSON 標識，其中的 ContentProducer 編碼可以反查到具體平台。',
          '記住這條不對稱原則：真實照片裡不可能憑空出現採樣器參數或 trainedAlgorithmicMedia 聲明，所以查到了基本就是定論；但截圖、社群平台轉碼、另存新檔都會輕易洗掉信號——所以沒查到不代表清白。',
        ],
      },
      {
        h: '2026 年的視覺檢查：有用，但不再能下結論',
        ps: [
          '網路上流傳的鑑別口訣大多是針對 2023 年那代模型寫的。手指畸形曾是最可靠的破綻，但 Midjourney v6、Flux 這一代已基本修復。現在還值得細看的位置：招牌和書脊上的文字（筆畫粘連、字符變形）、物理一致性（多光源下影子方向是否自洽、鏡面反射內容是否對得上場景）、人群樹葉磚牆等高頻區域的週期性重複紋理。',
          '視覺檢查的正確定位是「線索產生器」：它幫你決定要不要繼續深查，但單憑肉眼下結論——無論判 AI 還是判真——都不可靠。',
        ],
      },
      {
        h: '像素分類器與 SynthID',
        ps: [
          'Hive、AI or Not 這類服務不看元數據、只看像素：上採樣會在頻域留下週期性偽影，AI 圖也缺少真實感光元件的雜訊。它們對任何圖都能給出機率，這既是優點也是缺點——對新模型滯後、對重壓縮圖誤判率明顯上升，而且「87% AI」這種輸出沒辦法當證據拿去對質。Google 的 SynthID 是另一回事：嵌在像素裡的隱形浮水印，只有 Google 自家的檢測入口能讀，第三方工具讀不了。',
        ],
      },
      {
        h: '經得起檢驗的工作流程',
        ps: ['實際排查時按成本從低到高走：'],
        list: [
          '先在本機掃描檔案元數據，幾秒鐘出結果。有高可信度信號，到此為止。',
          '沒有信號，先確認手上是不是原始檔案；是截圖或轉發圖就先去找原圖。',
          '原圖也沒信號，做視覺檢查列疑點，再用一兩個像素分類器交叉驗證。',
          '結論重要的場合，加上反向搜圖（TinEye 可按首次出現時間排序），並保留原始檔案以備完整的 C2PA 簽章驗證。',
        ],
      },
    ],
  },
  en: {
    title: 'How to Tell Whether an Image Was AI-Generated: Check the File Before Your Eyes',
    desc: 'A practical workflow for suspicious images: read C2PA, XMP, PNG text chunks and EXIF first, then do visual checks and classifier cross-checks — with honest notes on where each method stops working.',
    lead: 'When a suspicious picture lands on your desk, the instinct is to zoom in and hunt for warped fingers. There is a faster first step: generators routinely write their own name into the file, and reading that record takes seconds. This guide follows the order that works in practice — file first, pixels second, cross-checks last — and is honest about where each method runs out.',
    sections: [
      {
        h: 'Metadata: the closest thing to a smoking gun',
        ps: [
          'Generators leave traces in four places. C2PA manifests (DALL-E 3, Firefly, Gemini/Imagen) carry a digitally signed record whose digitalSourceType=trainedAlgorithmicMedia is the strongest AI declaration there is. XMP often holds a CreatorTool entry from Midjourney, or Credit="Made with Google AI" on Google images. PNG text chunks are where Stable Diffusion WebUI dumps the entire recipe — prompt, steps, sampler, CFG scale, seed, model hash — and ComfyUI stores its full node graph as JSON in a workflow chunk. EXIF carries tool names in the Software tag, and Chinese platforms embed an AIGC JSON label in UserComment whose ContentProducer registration code identifies the exact service.',
          'Keep the asymmetry in mind: a real photo never contains a sampler setting or a trainedAlgorithmicMedia claim, so a hit is close to proof. But screenshots, social-media recompression and a casual "save as" strip these signals easily — finding nothing proves nothing.',
        ],
      },
      {
        h: 'Visual inspection in 2026: useful, no longer decisive',
        ps: [
          'Most spotting guides circulating online were written against 2023-era models. Hands — once the classic giveaway — are largely fixed in Midjourney v6 and Flux. What still repays a close look: lettering on signs and book spines (strokes that melt together), physical consistency (shadow directions that disagree, reflections that don’t match the scene), and periodic repeating textures in crowds, foliage or brickwork.',
          'Treat the visual pass as a lead generator. It tells you whether to dig deeper; it is not a verdict in either direction.',
        ],
      },
      {
        h: 'Pixel classifiers and SynthID',
        ps: [
          'Services like Hive or AI or Not skip metadata and model the pixels: upsampling leaves periodic frequency-domain artifacts, and generated images lack real sensor noise. They output a probability for any image — which is both their strength and their weakness. They lag behind new generators, error rates climb on heavily recompressed files, and "87% AI" is not something you can take into a dispute. Google’s SynthID is a separate case entirely: an invisible pixel-level watermark that only Google’s own checker can read; no third-party tool can verify it.',
        ],
      },
      {
        h: 'A workflow that holds up',
        ps: ['Work from cheap to expensive:'],
        list: [
          'Scan the file’s metadata locally first — seconds, zero cost. A high-confidence hit usually ends the question.',
          'No signal? Check whether you even have the original file; if it’s a screenshot or a forwarded copy, chase down the original before testing again.',
          'Still nothing: do the visual pass to collect suspicions, then cross-check with one or two pixel classifiers.',
          'When stakes are high, add reverse image search (TinEye can sort by first appearance) and keep the original file for full C2PA signature verification.',
        ],
      },
    ],
  },
  ja: {
    title: '画像が AI 生成かどうか見分けるには：目視より先にファイルを調べる',
    desc: '疑わしい画像の実践的な調査手順。まず C2PA・XMP・PNG テキストチャンク・EXIF の来歴シグナルを読み、その後に目視確認と分類器によるクロスチェックを行う。各手法の信頼できる範囲も正直に解説。',
    lead: '疑わしい画像を前にすると、つい拡大して指の本数を数えたくなります。しかし先にやるべきはファイル自体の確認です。生成ツールは自分の名前をファイル内に書き込んでいることが多く、それを読むのは数秒で済みます。この記事では「ファイル → 画面 → クロスチェック」という実務で機能する順番で進め、各手法がどこで通用しなくなるかも隠さず説明します。',
    sections: [
      {
        h: 'メタデータ：決定的証拠に最も近いもの',
        ps: [
          '生成ツールの痕跡は 4 か所に残ります。C2PA manifest（DALL-E 3、Firefly、Gemini/Imagen）はデジタル署名付きの記録で、digitalSourceType=trainedAlgorithmicMedia は最も強い AI 由来の宣言です。XMP には Midjourney の CreatorTool や、Google 系画像の Credit="Made with Google AI" がよく見られます。PNG テキストチャンクは Stable Diffusion WebUI が生成レシピ一式（プロンプト、Steps、Sampler、CFG、Seed、モデルハッシュ）を書き込む場所で、ComfyUI はノードグラフ全体を workflow チャンクに JSON で保存します。EXIF の Software タグにはツール名が入り、中国系プラットフォームは UserComment に AIGC JSON ラベルを埋め込みます。その ContentProducer 登録コードからサービスを特定できます。',
          '非対称性を覚えておいてください。本物の写真にサンプラー設定や trainedAlgorithmicMedia 宣言が紛れ込むことはないので、検出されればほぼ確定です。しかしスクリーンショット、SNS の再圧縮、「名前を付けて保存」で信号は簡単に消えます。何も見つからないことは何の証明にもなりません。',
        ],
      },
      {
        h: '2026 年の目視確認：有効だが、もう決め手にはならない',
        ps: [
          'ネットで出回っている見分け方の多くは 2023 年世代のモデルを前提に書かれたものです。かつて定番だった手の崩れは、Midjourney v6 や Flux ではほぼ解消されています。今でも見る価値があるのは、看板や本の背表紙の文字（筆画の溶け合い）、物理的な整合性（光源と影の方向の矛盾、鏡面反射の内容のずれ）、群衆・木の葉・レンガなど高周波領域の周期的な繰り返しテクスチャです。',
          '目視確認の正しい位置づけは「手がかりの生成器」です。深掘りすべきかどうかの判断材料にはなりますが、目視だけで AI とも本物とも断定はできません。',
        ],
      },
      {
        h: 'ピクセル分類器と SynthID',
        ps: [
          'Hive や AI or Not のようなサービスはメタデータを見ず、ピクセルそのものを統計的に判定します。アップサンプリングは周波数領域に周期的なアーティファクトを残し、生成画像には実カメラのセンサーノイズがありません。どんな画像にも確率を出せるのが強みであり弱みでもあります。新しいモデルへの対応は遅れ、強く再圧縮されたファイルでは誤判定が増え、「87% AI」という出力は証拠としては使えません。Google の SynthID は別物です。ピクセルに埋め込まれた不可視透かしで、読めるのは Google 自身の検出器だけ。サードパーティのツールでは検証できません。',
        ],
      },
      {
        h: '実務に耐える手順',
        ps: ['コストの低い順に進めます。'],
        list: [
          'まずローカルでファイルのメタデータをスキャン。数秒で終わり、高信頼のヒットが出ればそこで決着です。',
          '信号がなければ、手元のファイルが原本かどうかを確認。スクリーンショットや転送コピーなら、先に原本を入手してから再テスト。',
          'それでも何もなければ、目視で疑問点を洗い出し、ピクセル分類器 1〜2 個でクロスチェック。',
          '結論が重要な場面では逆画像検索（TinEye は初出時刻順に並べ替え可能）を加え、完全な C2PA 署名検証に備えて原本ファイルを保管しておく。',
        ],
      },
    ],
  },
  ko: {
    title: '이미지가 AI 생성인지 판별하는 법: 눈보다 먼저 파일을 확인하라',
    desc: '의심스러운 이미지의 실전 조사 절차: C2PA, XMP, PNG 텍스트 청크, EXIF의 출처 신호를 먼저 읽고, 그다음 육안 검사와 분류기 교차 검증을 진행합니다. 각 방법의 신뢰 한계도 솔직하게 설명합니다.',
    lead: '의심스러운 이미지를 받으면 본능적으로 확대해서 손가락부터 세게 됩니다. 하지만 더 빠른 첫걸음은 파일 자체를 확인하는 것입니다. 생성 도구는 자기 이름을 파일 안에 적어 두는 경우가 많고, 그 기록을 읽는 데는 몇 초면 충분합니다. 이 글은 실무에서 통하는 순서 — 파일 먼저, 화면 다음, 교차 검증 마지막 — 로 진행하며, 각 방법이 어디서부터 통하지 않는지도 숨기지 않고 다룹니다.',
    sections: [
      {
        h: '메타데이터: 결정적 증거에 가장 가까운 것',
        ps: [
          '생성 도구의 흔적은 네 곳에 남습니다. C2PA manifest(DALL-E 3, Firefly, Gemini/Imagen)는 디지털 서명된 기록으로, digitalSourceType=trainedAlgorithmicMedia는 가장 강력한 AI 출처 선언입니다. XMP에는 Midjourney가 쓰는 CreatorTool이나 Google 계열 이미지의 Credit="Made with Google AI"가 자주 보입니다. PNG 텍스트 청크는 Stable Diffusion WebUI가 생성 레시피 전체(프롬프트, Steps, Sampler, CFG, Seed, 모델 해시)를 기록하는 곳이고, ComfyUI는 노드 그래프 전체를 workflow 청크에 JSON으로 저장합니다. EXIF Software 태그에는 도구 이름이 들어가며, 중국 플랫폼은 UserComment에 AIGC JSON 라벨을 심는데 그 ContentProducer 등록 코드로 어느 서비스인지 역추적할 수 있습니다.',
          '비대칭 원칙을 기억하세요. 실제 사진에 샘플러 설정이나 trainedAlgorithmicMedia 선언이 우연히 들어갈 수는 없으므로, 신호가 잡히면 거의 확정입니다. 반대로 스크린샷, SNS 재압축, "다른 이름으로 저장" 한 번이면 신호는 쉽게 사라집니다. 아무것도 안 나왔다는 것은 아무것도 증명하지 못합니다.',
        ],
      },
      {
        h: '2026년의 육안 검사: 유용하지만 더는 결정적이지 않다',
        ps: [
          '인터넷에 퍼진 판별 요령 대부분은 2023년 세대 모델을 기준으로 쓰였습니다. 한때 가장 확실한 단서였던 손가락 기형은 Midjourney v6, Flux 세대에서 거의 해결됐습니다. 지금도 들여다볼 가치가 있는 곳은 간판이나 책등의 글자(획이 뭉개지는 현상), 물리적 일관성(광원과 그림자 방향의 모순, 거울·수면 반사 내용의 불일치), 군중·나뭇잎·벽돌 같은 고주파 영역의 주기적 반복 텍스처입니다.',
          '육안 검사의 올바른 역할은 "단서 생성기"입니다. 더 파야 할지 판단하는 데는 도움이 되지만, 눈만으로 AI다 진짜다 결론을 내리는 것은 어느 쪽으로든 신뢰할 수 없습니다.',
        ],
      },
      {
        h: '픽셀 분류기와 SynthID',
        ps: [
          'Hive, AI or Not 같은 서비스는 메타데이터 대신 픽셀 자체를 통계적으로 분석합니다. 업샘플링은 주파수 영역에 주기적 아티팩트를 남기고, 생성 이미지에는 실제 센서 노이즈가 없습니다. 어떤 이미지든 확률을 내준다는 게 장점이자 단점입니다. 새 모델에는 뒤처지고, 강하게 재압축된 파일에서는 오판율이 올라가며, "87% AI"라는 출력은 분쟁에서 증거로 쓸 수 없습니다. Google의 SynthID는 완전히 별개입니다. 픽셀에 심어진 비가시 워터마크로, Google 자체 검출기만 읽을 수 있고 서드파티 도구로는 검증이 불가능합니다.',
        ],
      },
      {
        h: '실무에서 통하는 절차',
        ps: ['비용이 낮은 순서로 진행합니다.'],
        list: [
          '먼저 로컬에서 파일 메타데이터를 스캔 — 몇 초, 비용 제로. 높은 신뢰도의 신호가 나오면 거기서 끝입니다.',
          '신호가 없으면 지금 가진 파일이 원본인지 확인하세요. 스크린샷이나 전달받은 사본이라면 원본부터 구한 뒤 다시 테스트합니다.',
          '그래도 없으면 육안 검사로 의심 지점을 모으고, 픽셀 분류기 한두 개로 교차 검증합니다.',
          '결론이 중요한 사안이라면 역방향 이미지 검색(TinEye는 최초 등장 시점순 정렬 가능)을 추가하고, 완전한 C2PA 서명 검증에 대비해 원본 파일을 보관하세요.',
        ],
      },
    ],
  },
  de: {
    title: 'Woran erkennt man ein AI-generiertes Bild? Erst die Datei prüfen, dann die Pixel',
    desc: 'Ein praxistauglicher Ablauf für verdächtige Bilder: zuerst C2PA, XMP, PNG-Textchunks und EXIF auslesen, dann Sichtprüfung und Klassifikator-Gegenprobe — mit ehrlichen Hinweisen, wo jede Methode an ihre Grenzen stößt.',
    lead: 'Landet ein verdächtiges Bild auf dem Tisch, ist der Reflex, hineinzuzoomen und nach verformten Fingern zu suchen. Es gibt einen schnelleren ersten Schritt: Generatoren schreiben ihren Namen häufig direkt in die Datei, und dieses Protokoll zu lesen dauert Sekunden. Dieser Leitfaden folgt der Reihenfolge, die sich in der Praxis bewährt — erst die Datei, dann die Pixel, zuletzt die Gegenproben — und benennt offen, wo jede Methode aufhört zu funktionieren.',
    sections: [
      {
        h: 'Metadaten: das Nächste an einem Beweis',
        ps: [
          'Generatoren hinterlassen Spuren an vier Stellen. C2PA-Manifeste (DALL-E 3, Firefly, Gemini/Imagen) sind digital signierte Protokolle; digitalSourceType=trainedAlgorithmicMedia ist die stärkste AI-Herkunftserklärung überhaupt. Im XMP findet sich oft ein CreatorTool-Eintrag von Midjourney oder Credit="Made with Google AI" bei Google-Bildern. PNG-Textchunks sind der Ort, an dem Stable Diffusion WebUI das komplette Rezept ablegt — Prompt, Steps, Sampler, CFG, Seed, Modell-Hash — und ComfyUI speichert seinen gesamten Node-Graphen als JSON im workflow-Chunk. EXIF trägt Werkzeugnamen im Software-Tag, und chinesische Plattformen betten ein AIGC-JSON-Label in UserComment ein, dessen ContentProducer-Registrierungscode den genauen Dienst identifiziert.',
          'Wichtig ist die Asymmetrie: In einem echten Foto tauchen niemals Sampler-Einstellungen oder eine trainedAlgorithmicMedia-Erklärung auf — ein Treffer ist also fast ein Beweis. Aber Screenshots, Social-Media-Rekompression und ein beiläufiges „Speichern unter" entfernen diese Signale mühelos. Nichts zu finden beweist nichts.',
        ],
      },
      {
        h: 'Sichtprüfung 2026: nützlich, aber nicht mehr entscheidend',
        ps: [
          'Die meisten kursierenden Erkennungstipps wurden für Modelle der 2023er-Generation geschrieben. Hände — einst das klassische Verräterzeichen — sind in Midjourney v6 und Flux weitgehend korrigiert. Was sich noch lohnt: Schrift auf Schildern und Buchrücken (ineinanderlaufende Striche), physikalische Konsistenz (widersprüchliche Schattenrichtungen, Spiegelungen, die nicht zur Szene passen) und periodisch wiederholte Texturen in Menschenmengen, Laub oder Mauerwerk.',
          'Die Sichtprüfung ist ein Hinweisgenerator: Sie sagt, ob sich tieferes Graben lohnt. Ein Urteil — in keine Richtung — ist sie nicht.',
        ],
      },
      {
        h: 'Pixel-Klassifikatoren und SynthID',
        ps: [
          'Dienste wie Hive oder AI or Not ignorieren Metadaten und modellieren die Pixel: Upsampling hinterlässt periodische Artefakte im Frequenzraum, und generierten Bildern fehlt echtes Sensorrauschen. Sie liefern für jedes Bild eine Wahrscheinlichkeit — Stärke und Schwäche zugleich. Sie hinken neuen Generatoren hinterher, die Fehlerquote steigt bei stark rekomprimierten Dateien, und „87 % AI" taugt nicht als Beleg in einer Auseinandersetzung. Googles SynthID ist ein Sonderfall: ein unsichtbares Wasserzeichen auf Pixelebene, das nur Googles eigener Prüfer lesen kann — kein Drittanbieter-Tool kann es verifizieren.',
        ],
      },
      {
        h: 'Ein Ablauf, der standhält',
        ps: ['Von günstig nach teuer vorgehen:'],
        list: [
          'Zuerst die Metadaten der Datei lokal scannen — Sekunden, kostenlos. Ein Treffer mit hoher Konfidenz beendet die Frage meist.',
          'Kein Signal? Prüfen, ob überhaupt die Originaldatei vorliegt; bei Screenshot oder weitergeleiteter Kopie erst das Original besorgen.',
          'Immer noch nichts: Sichtprüfung für Verdachtsmomente, dann Gegenprobe mit ein bis zwei Pixel-Klassifikatoren.',
          'Bei hohem Einsatz: Rückwärts-Bildersuche ergänzen (TinEye sortiert nach Erstauftauchen) und die Originaldatei für eine vollständige C2PA-Signaturprüfung aufbewahren.',
        ],
      },
    ],
  },
  fr: {
    title: 'Comment savoir si une image a été générée par IA ? Vérifiez le fichier avant vos yeux',
    desc: 'Un déroulé pratique pour les images suspectes : lire d’abord C2PA, XMP, les chunks texte PNG et l’EXIF, puis inspection visuelle et recoupement par classifieurs — avec les limites honnêtes de chaque méthode.',
    lead: 'Face à une image suspecte, le réflexe est de zoomer pour traquer les doigts difformes. Il existe un premier pas plus rapide : les générateurs écrivent souvent leur propre nom dans le fichier, et lire ce registre prend quelques secondes. Ce guide suit l’ordre qui fonctionne en pratique — le fichier d’abord, les pixels ensuite, les recoupements en dernier — et dit franchement où chaque méthode cesse de fonctionner.',
    sections: [
      {
        h: 'Les métadonnées : ce qui se rapproche le plus d’une preuve',
        ps: [
          'Les générateurs laissent des traces à quatre endroits. Les manifestes C2PA (DALL-E 3, Firefly, Gemini/Imagen) sont des registres signés numériquement ; digitalSourceType=trainedAlgorithmicMedia y constitue la déclaration d’origine IA la plus forte qui soit. Le XMP contient souvent un CreatorTool écrit par Midjourney, ou Credit="Made with Google AI" sur les images Google. Les chunks texte PNG sont l’endroit où Stable Diffusion WebUI consigne la recette complète — prompt, steps, sampler, CFG, seed, hash du modèle — et ComfyUI y stocke son graphe de nœuds entier en JSON dans un chunk workflow. L’EXIF porte des noms d’outils dans le tag Software, et les plateformes chinoises insèrent un label JSON AIGC dans UserComment, dont le code d’enregistrement ContentProducer identifie le service exact.',
          'Gardez l’asymétrie en tête : une vraie photo ne contient jamais de réglage de sampler ni de déclaration trainedAlgorithmicMedia — un résultat positif vaut donc presque preuve. Mais captures d’écran, recompression des réseaux sociaux et un simple « enregistrer sous » effacent ces signaux sans effort. Ne rien trouver ne prouve rien.',
        ],
      },
      {
        h: 'L’inspection visuelle en 2026 : utile, plus décisive',
        ps: [
          'La plupart des astuces qui circulent ont été écrites pour les modèles de 2023. Les mains — jadis l’indice classique — sont largement corrigées dans Midjourney v6 et Flux. Ce qui mérite encore l’attention : le lettrage des enseignes et des dos de livres (traits qui fusionnent), la cohérence physique (directions d’ombres contradictoires, reflets qui ne correspondent pas à la scène), et les textures répétitives périodiques dans les foules, le feuillage ou la brique.',
          'Considérez le passage visuel comme un générateur de pistes : il indique s’il faut creuser, mais ne constitue un verdict dans aucun sens.',
        ],
      },
      {
        h: 'Classifieurs de pixels et SynthID',
        ps: [
          'Des services comme Hive ou AI or Not ignorent les métadonnées et modélisent les pixels : le suréchantillonnage laisse des artefacts périodiques dans le domaine fréquentiel, et les images générées manquent du bruit de capteur réel. Ils produisent une probabilité pour n’importe quelle image — leur force et leur faiblesse à la fois. Ils sont en retard sur les nouveaux générateurs, le taux d’erreur grimpe sur les fichiers fortement recompressés, et « 87 % IA » ne se plaide pas dans un litige. SynthID de Google est un cas à part : un filigrane invisible au niveau des pixels que seul le vérificateur de Google sait lire — aucun outil tiers ne peut le vérifier.',
        ],
      },
      {
        h: 'Un déroulé qui tient la route',
        ps: ['Procédez du moins cher au plus cher :'],
        list: [
          'Scannez d’abord les métadonnées du fichier en local — quelques secondes, coût nul. Un résultat à haute confiance clôt généralement la question.',
          'Aucun signal ? Vérifiez que vous disposez bien du fichier original ; s’il s’agit d’une capture ou d’une copie transférée, récupérez l’original avant de retester.',
          'Toujours rien : faites la passe visuelle pour collecter les doutes, puis recoupez avec un ou deux classifieurs de pixels.',
          'Quand l’enjeu est élevé, ajoutez la recherche d’image inversée (TinEye trie par première apparition) et conservez le fichier original pour une vérification complète de la signature C2PA.',
        ],
      },
    ],
  },
  es: {
    title: '¿Cómo saber si una imagen fue generada por IA? Revisa el archivo antes que tus ojos',
    desc: 'Un flujo práctico para imágenes sospechosas: leer primero C2PA, XMP, los chunks de texto PNG y el EXIF, luego inspección visual y contraste con clasificadores — con los límites honestos de cada método.',
    lead: 'Cuando llega una imagen sospechosa, el instinto es hacer zoom y buscar dedos deformes. Hay un primer paso más rápido: los generadores suelen escribir su propio nombre dentro del archivo, y leer ese registro toma segundos. Esta guía sigue el orden que funciona en la práctica — primero el archivo, luego los píxeles, al final los contrastes — y dice con franqueza dónde deja de funcionar cada método.',
    sections: [
      {
        h: 'Metadatos: lo más cercano a una prueba',
        ps: [
          'Los generadores dejan rastros en cuatro lugares. Los manifiestos C2PA (DALL-E 3, Firefly, Gemini/Imagen) son registros firmados digitalmente; digitalSourceType=trainedAlgorithmicMedia es la declaración de origen IA más fuerte que existe. El XMP suele contener un CreatorTool escrito por Midjourney, o Credit="Made with Google AI" en imágenes de Google. Los chunks de texto PNG son donde Stable Diffusion WebUI vuelca la receta completa — prompt, steps, sampler, CFG, seed, hash del modelo — y ComfyUI guarda su grafo de nodos entero como JSON en un chunk workflow. El EXIF lleva nombres de herramientas en el tag Software, y las plataformas chinas insertan una etiqueta JSON AIGC en UserComment cuyo código de registro ContentProducer identifica el servicio exacto.',
          'Tenga presente la asimetría: una foto real jamás contiene un ajuste de sampler ni una declaración trainedAlgorithmicMedia, así que un acierto es casi una prueba. Pero capturas de pantalla, la recompresión de redes sociales y un simple «guardar como» borran estas señales sin esfuerzo. No encontrar nada no demuestra nada.',
        ],
      },
      {
        h: 'La inspección visual en 2026: útil, ya no decisiva',
        ps: [
          'La mayoría de los trucos que circulan se escribieron para los modelos de 2023. Las manos — antes el delator clásico — están mayormente corregidas en Midjourney v6 y Flux. Lo que todavía merece atención: las letras en carteles y lomos de libros (trazos que se funden), la coherencia física (sombras con direcciones contradictorias, reflejos que no corresponden a la escena) y las texturas repetitivas periódicas en multitudes, follaje o ladrillos.',
          'Trate el examen visual como un generador de pistas: indica si conviene profundizar, pero no es un veredicto en ningún sentido.',
        ],
      },
      {
        h: 'Clasificadores de píxeles y SynthID',
        ps: [
          'Servicios como Hive o AI or Not ignoran los metadatos y modelan los píxeles: el sobremuestreo deja artefactos periódicos en el dominio de la frecuencia, y a las imágenes generadas les falta el ruido real del sensor. Producen una probabilidad para cualquier imagen — su fortaleza y su debilidad a la vez. Van rezagados frente a los generadores nuevos, la tasa de error sube con archivos muy recomprimidos, y «87 % IA» no sirve como evidencia en una disputa. SynthID de Google es un caso aparte: una marca de agua invisible a nivel de píxel que solo el verificador de Google puede leer; ninguna herramienta de terceros puede comprobarla.',
        ],
      },
      {
        h: 'Un flujo de trabajo que se sostiene',
        ps: ['Avance de lo barato a lo caro:'],
        list: [
          'Primero escanee los metadatos del archivo en local — segundos, costo cero. Un acierto de alta confianza suele zanjar la cuestión.',
          '¿Sin señal? Verifique si tiene el archivo original; si es una captura o una copia reenviada, consiga el original antes de volver a probar.',
          'Si sigue sin haber nada: haga el examen visual para reunir sospechas y contraste con uno o dos clasificadores de píxeles.',
          'Cuando hay mucho en juego, añada búsqueda inversa de imágenes (TinEye ordena por primera aparición) y conserve el archivo original para una verificación completa de la firma C2PA.',
        ],
      },
    ],
  },
  'pt-BR': {
    title: 'Como saber se uma imagem foi gerada por IA? Verifique o arquivo antes dos seus olhos',
    desc: 'Um fluxo prático para imagens suspeitas: ler primeiro C2PA, XMP, chunks de texto PNG e EXIF, depois inspeção visual e contraprova com classificadores — com os limites honestos de cada método.',
    lead: 'Quando uma imagem suspeita chega, o instinto é dar zoom e caçar dedos deformados. Há um primeiro passo mais rápido: os geradores costumam escrever o próprio nome dentro do arquivo, e ler esse registro leva segundos. Este guia segue a ordem que funciona na prática — arquivo primeiro, pixels depois, contraprovas por último — e é franco sobre onde cada método deixa de funcionar.',
    sections: [
      {
        h: 'Metadados: o mais próximo de uma prova',
        ps: [
          'Os geradores deixam rastros em quatro lugares. Manifestos C2PA (DALL-E 3, Firefly, Gemini/Imagen) são registros assinados digitalmente; digitalSourceType=trainedAlgorithmicMedia é a declaração de origem IA mais forte que existe. O XMP costuma trazer um CreatorTool gravado pelo Midjourney, ou Credit="Made with Google AI" em imagens do Google. Os chunks de texto PNG são onde o Stable Diffusion WebUI despeja a receita completa — prompt, steps, sampler, CFG, seed, hash do modelo — e o ComfyUI guarda o grafo de nós inteiro como JSON em um chunk workflow. O EXIF carrega nomes de ferramentas no tag Software, e plataformas chinesas embutem um rótulo JSON AIGC no UserComment cujo código de registro ContentProducer identifica o serviço exato.',
          'Guarde a assimetria: uma foto real nunca contém configuração de sampler nem declaração trainedAlgorithmicMedia, então um acerto é quase prova. Mas capturas de tela, recompressão de redes sociais e um simples "salvar como" apagam esses sinais com facilidade. Não encontrar nada não prova nada.',
        ],
      },
      {
        h: 'Inspeção visual em 2026: útil, mas não mais decisiva',
        ps: [
          'A maioria das dicas que circulam foi escrita para os modelos de 2023. As mãos — antes o delator clássico — estão em grande parte corrigidas no Midjourney v6 e no Flux. O que ainda vale a pena examinar: letras em placas e lombadas de livros (traços que se fundem), coerência física (sombras em direções contraditórias, reflexos que não batem com a cena) e texturas repetitivas periódicas em multidões, folhagens ou tijolos.',
          'Trate a inspeção visual como um gerador de pistas: ela diz se vale a pena cavar mais fundo, mas não é veredito em nenhuma direção.',
        ],
      },
      {
        h: 'Classificadores de pixels e SynthID',
        ps: [
          'Serviços como Hive ou AI or Not ignoram metadados e modelam os pixels: o upsampling deixa artefatos periódicos no domínio da frequência, e imagens geradas não têm o ruído real do sensor. Eles produzem uma probabilidade para qualquer imagem — força e fraqueza ao mesmo tempo. Ficam atrás dos geradores novos, a taxa de erro sobe em arquivos muito recomprimidos, e "87% IA" não serve como evidência numa disputa. O SynthID do Google é um caso à parte: uma marca-d’água invisível em nível de pixel que só o verificador do próprio Google consegue ler; nenhuma ferramenta de terceiros pode conferi-la.',
        ],
      },
      {
        h: 'Um fluxo de trabalho que se sustenta',
        ps: ['Avance do barato para o caro:'],
        list: [
          'Primeiro escaneie os metadados do arquivo localmente — segundos, custo zero. Um acerto de alta confiança costuma encerrar a questão.',
          'Sem sinal? Verifique se você tem mesmo o arquivo original; se for captura de tela ou cópia encaminhada, consiga o original antes de testar de novo.',
          'Ainda nada: faça a inspeção visual para reunir suspeitas e cruze com um ou dois classificadores de pixels.',
          'Quando o risco é alto, adicione busca reversa de imagens (o TinEye ordena por primeira aparição) e guarde o arquivo original para a verificação completa da assinatura C2PA.',
        ],
      },
    ],
  },
};

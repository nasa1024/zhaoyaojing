# SynthID Detector 关联与后续接入

更新：2026-10-08

## 背景

Google 于 2026-10-07 把 SynthID Detector（https://synthid.com/）向全球开放，界面仅英文。它检查图片、视频、音频里的 SynthID 隐形水印，覆盖 Google、OpenAI、NVIDIA、Kakao，Apple 标注为“soon”。结果只有“检测到 / 未检测到”，视频和音频按片段给出。需要登录，有每日配额；上传文件返回结果后删除，文件签名保留 24 小时用于配额。

本站读的是文件里的元数据（C2PA、EXIF、XMP、PNG 文本块、MP4），SynthID 读的是像素/音频里的水印。两者失效场景相反：截图、压缩会洗掉元数据，水印通常还在。所以定位是互补，不是竞争。

## 已上线

- 说明页：`/blog/synthid-detector/`（简体中文）与 `/en/blog/synthid-detector/`（英文），组件 `web/src/components/SynthIDDetectorArticle.astro`。
- 检测结果页跳转：`web/public/scripts/render.js` 的 `renderSynthidHandoff`。触发条件是状态 C（没发现信号），或信号/claim_generator 命中 SynthID 合作方（Google/Gemini/Imagen/Veo/OpenAI/DALL-E/Sora/NVIDIA/Kakao 等）。给出 synthid.com 外链和说明页链接，GA 事件 `synthid_handoff_clicked`（参数 `target` = portal / guide，`state`）。
- 旧文案修正：Gemini 指南（中/英）、AI 图片检测指南不再说“只有 Google 的封闭入口能查”。

## 不能做的

synthid.com 附加条款明确禁止：以编程方式提交请求、抓取、把前端当自动化 API 批量调用、多账号绕过配额。因此不能在后台代用户调用 synthid.com，也不能做“上传到本站、本站转发给 Google”的代理。这同时违背本站“文件不离开浏览器”的承诺。

## 后续接入选项（按优先级）

1. **看 `synthid_handoff_clicked` 数据（无需开发）**。上线两周后看点击率，以及 portal 与 guide 的比例，决定是否把跳转做得更显眼（例如状态 C 时放到结果顶部）。

2. **把 C2PA 里的 SynthID 声明作为单独信号（Rust/WASM 改动）**。Google 的部分 C2PA manifest 会写明应用了 SynthID。现在检测器没有单独识别这一点（`src/` 中无 synthid 相关逻辑）。可在 C2PA 解析里匹配 SynthID 相关断言，输出一条“声明已加 SynthID 水印”的中等置信度信号，结果页据此把跳转文案改成“文件声明含 SynthID，去 Google 验证水印是否还在”。需要真实样本确认字段位置后再写，改完要重新 `wasm-pack build`。

3. **Google Cloud AI Content Detection API（仅在有明确商业需求时）**。官方文档：https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/ai-content-detection 。现状是 Private Preview，需要填申请表；只支持 JPEG/PNG/WebP；原理是分析像素伪影、噪声和频谱异常，**是分类器，不是 SynthID 水印检测**，文案里不能把它叫“SynthID API”。如果接入，只能做成用户主动勾选的“上传到云端深度检测”，由 `web/worker.js` 代理并持有凭据，结果单独标注来源和概率性质，并更新隐私政策。

4. **关注官方 SynthID Detector API**。若 Google 以后开放面向开发者的水印检测 API（带明确的调用条款），再评估方案 3 的同一套 opt-in 上传流程，届时可以直接在结果页显示水印结果。在此之前保持“链接跳转”。

## 监控

- GSC：`SynthID Detector`、`synthid detector`、`synthid checker`、`SynthID 检测` 的展示与排名，页面 `/en/blog/synthid-detector/`、`/blog/synthid-detector/`。
- Google 公告或 synthid.com FAQ 变更（新合作方、Apple 正式上线、多语言、文本检测）时，同步更新说明页的 Key facts、FAQ 和 `sitemap-lastmod.json`。

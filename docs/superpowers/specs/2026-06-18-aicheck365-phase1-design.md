# AICheck365 阶段一重塑设计文档（Phase 1：建立核心信任）

- 状态：已通过头脑风暴评审，待用户复核
- 日期：2026-06-18
- 分支：`feature/aicheck365-phase1-evidence-lab`
- 来源需求：`docs/change.md`（《AICheck365 官网重塑需求文档》）
- 适用范围：仅 `docs/change.md` 的**第一阶段（建立核心信任）**，对应需求文档 §21.1

---

## 1. 背景与目标

### 1.1 现状

本仓库是 **AICheck**：

- 核心引擎为 Rust crate（`src/`），编译为 WASM 后在浏览器**本地**执行，检测 C2PA-lite、EXIF、XMP、PNG 文本块、MP4/MOV 容器与 SEI、文件名启发式、DWT-DCT 隐形水印、可见水印。对前端暴露 `analyzeMedia()` / `analyzeImage()` / `analyzeVideoFrameRgba()` / `supportedMediaCapabilities()`。
- 前端为 Astro 站点（`web/`），部署在 Cloudflare（`aicheck365.com`）。现有页面：检测器首页、13 个平台指南、5 篇博客、about/privacy/terms/contact、404、`[lang]/[...path]` 多语言 catch-all。
- 现有结果模型：单一置信度徽章（`HIGH/MEDIUM/LOW/NONE`）+ 二元 `ai_generated` + 信号卡片。**这正是需求文档要替换的"不透明 AI 概率"模型。**
- i18n：9 种语言（zh-CN/zh-TW/en/ja/ko/de/fr/es/pt-BR），客户端 `i18n.js` + 各页面服务端 copy 对象，zh-CN 在根路径，其余在 `/[lang]/`。

### 1.2 本阶段目标

让用户第一次进入网站，就能理解 AICheck365 与普通"AI 检测上传框"的区别：

1. 首页从"上传框"升级为 **AI 媒体证据实验室** 的入口与叙事。
2. 检测结果从"一个 AI 概率"升级为 **四状态证据分层模型**。
3. 引入真正的 C2PA 数字签名验证（浏览器本地）。
4. 提供 **Signal Receipt** 本地导出。
5. 新增 **方法论页**，更新 **隐私页**。
6. 全部新文案覆盖 9 种语言。
7. 全面采用 **Forensic Pop** 视觉系统。

### 1.3 非目标（本阶段明确不做）

- Evidence Atlas（实验数据库）、真实实验记录系统 → Phase 2。
- AI 图片鉴别挑战游戏 → Phase 3。
- 新增/扩写平台档案（沿用现有 13 个平台页，仅做指纹胶囊链接）→ Phase 2。
- 真实样本文件、真实"最新实验"数据 → 由用户后续提供后填充（本阶段只做 UI + 数据 schema + 占位）。

---

## 2. 架构决策

### 2.1 技术路线：保持无框架

沿用 **Astro SSG + 原生 JS 渐进增强**，不引入 UI 框架。理由：

- 满足需求 §15.1（核心正文必须存在于服务端 HTML）。
- 满足需求 §19（JS 加载失败时仍能看到主题/说明/格式/FAQ/方法论/链接）。
- 满足性能要求，零新增运行时依赖，符合 YAGNI。
- 滚动叙事用 CSS + `IntersectionObserver` 实现，不需要框架。

### 2.2 前端模块拆分

当前 `web/src/scripts/main.js`（660 行）随结果重写会继续膨胀，拆分为：

| 模块 | 职责 |
|------|------|
| `detect.js` | 文件选择、WASM 引导、视频抽帧、检测编排（保留现有逻辑） |
| `state.js` | **四状态派生**：把引擎输出映射为 A/B/C/D 与证据层级 |
| `render.js` | 结果页渲染（证据卡、未发现信号、原始字段、专家模式、决策树） |
| `receipt.js` | Signal Receipt 生成与本地导出（JSON/PNG/文本/引用/分享卡/打印 PDF） |
| `history.js` | 本地历史记录（保留现有逻辑） |

这是**有界重构**：仅因为结果渲染整体重写而拆分，不触碰无关代码。

### 2.3 视觉系统组织

- 新增 `web/public/tokens.css`：设计令牌（颜色/字体/间距/圆角/动效变量）。
- 现有 `web/public/style.css` 改为消费令牌；新组件样式按 Forensic Pop 重写。
- 保留现有 dark/light 主题切换机制。

---

## 3. 引擎改造（Rust → WASM）：真实 C2PA 签名验证

### 3.1 依赖变更

`Cargo.toml` 的 wasm target 依赖新增 c2pa（当前 c2pa 仅在 `cfg(not(target_arch = "wasm32"))` 桌面端）：

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
c2pa = { version = "0.82", default-features = false, features = ["rust_native_crypto"] }
```

- `--no-default-features` 去掉 `file_io`/OpenSSL；`rust_native_crypto` 使用纯 Rust 加密后端，可编译到 `wasm32-unknown-unknown`。
- 若 `ValidationState` / `rust_native_crypto` 在 0.77 不可用则升级版本（构建时验证；桌面端 CLI 同步对齐版本，避免双版本）。

### 3.2 新增 WASM 接口

```rust
// 仅 wasm32 编译
#[wasm_bindgen]
pub fn verify_c2pa(bytes: &[u8], mime: &str) -> JsValue;
// 返回:
// {
//   state: "trusted" | "valid" | "invalid" | "unsigned",
//   manifest: { title, format, claim_generator, digital_source_type, assertions, ingredients } | null,
//   validation_status: [{ code, url, explanation }],   // state=invalid 时填充
//   raw_json: string                                   // reader.json()，供专家模式
// }
```

- 实现：`Reader::from_stream(mime, Cursor::new(bytes))` → 读取 `reader.validation_state()` / `validation_status()` / `validation_results()` / `active_manifest()`。
- `JumbfNotFound` → `state: "unsigned"`，不报错。
- `analyzeMedia` 报告新增 `provenance` 字段承载上述结构（引擎向后兼容，旧字段不变）。

### 3.3 构建与风险（必须验证，不得假设）

| 风险 | 验证方式 | 兜底 |
|------|----------|------|
| c2pa + `rust_native_crypto` 能否在 `wasm-pack build --target web` 下干净编译 | 本地实跑 `wasm-pack build` | 失败则升级/调整 feature；仍失败则回退 JS 派生并向用户报告 |
| wasm 包体积增长（wasm-opt 已关闭） | 构建后测量体积 | 体积过大则把 C2PA 验证器拆为按需懒加载模块 |
| Cloudflare 构建环境是否有 Clang | 检查/配置构建命令 | 在 `wrangler.toml` build 步骤前安装；或预构建 wasm 提交 |
| 桌面 CLI 与 wasm 双 c2pa 版本一致性 | 统一版本号 | — |

> **诚实底线**：在签名无法验证时**绝不**伪造状态 A/D。若引擎集成受阻，立即向用户报告，并临时回退到"发现来源声明，签名未验证"表述。

---

## 4. 四状态证据模型（需求 §9）

### 4.1 状态派生规则（`state.js`）

输入：引擎报告（含 `signals[]`、`provenance`、`limitations[]`）。输出：四状态之一 + 证据层级 + 文案 key。

| 状态 | 触发条件 | 语义色 |
|------|----------|--------|
| **A 发现可验证的 AI 来源凭证** | `provenance.state ∈ {trusted, valid}` 且 manifest 含 AI 相关 `digital_source_type`/`claim_generator`。`trusted` 与 `valid`（签名有效但签名者不在信任列表）在详情中明确区分 | 绿 |
| **B 发现 AI 相关元数据** | 无有效签名，但发现 AI 相关元数据：XMP `AISystemUsed`/`DigitalSourceType`、PNG 生成参数、EXIF `Software` 命中、C2PA-lite 文本命中、文件名启发式 | 黄（弱信号 / 可被修改，绿色仅留给可验证签名） |
| **C 未发现可识别的来源信号** | 无任何来源信号 | 灰紫 |
| **D 签名失效或信息冲突** | `provenance.state == invalid`（篡改/签名失败，附 `validation_status` 错误码）**或** 字段冲突（如相机 EXIF Make/Model + AI `claim_generator` 并存） | 红 |

- 状态 C 必须同时显示需求 §9.1/§20 的强制文案：「这不能证明文件由人类创作。来源信息可能从未写入，也可能在截图、压缩、转码或重新导出时被删除。」
- 状态 D **不得给出确定性来源结论**。

### 4.2 结果页结构（需求 §9.2，按顺序）

1. 结论摘要（状态徽章 + 一句话语义色）
2. 证据等级
3. 发现的信号（Evidence Card 列表）
4. **未发现的信号**（明确列出查过但没找到的层）
5. 文件传播 / 编辑线索
6. 原始字段（折叠）
7. 限制说明
8. 下一步建议（§9.3 决策树）
9. 相关平台档案（链接现有 `/platforms/*`）
10. 相关知识文章（链接现有 blog）
11. 导出与分享（Signal Receipt）

### 4.3 普通模式 / 专家模式（需求 §9.4）

- 普通模式默认隐藏：完整字段路径、原始 JSON、二进制结构摘要、验证日志、哈希、时间戳、解析器版本、规则版本。
- 专家模式开关持久化（localStorage），展开上述内容。专家模式数据来自 `provenance.raw_json` 与各信号 `details`。

### 4.4 下一步决策树（需求 §9.3）

- 未检测到来源信号（状态 C）：确认是否原始文件 → 获取最早发布版本 → 检查是否截图 → 检查是否经聊天软件压缩 → 谨慎参考视觉异常（不单独依赖）→ 查看对应平台已知标记 → 对比其他来源。
- 检测到平台信号（A/B）：查看字段含义 → 查看平台指纹档案 → 比较其他平台来源声明 → 查看相同平台真实样本（待数据）→ 导出报告。

### 4.5 隐私与 SEO 取舍

- 结果由用户文件本地生成 → 结果区客户端渲染并 `noindex`。
- 页面**外壳** + 工具说明 + FAQ + 方法论 + 内部链接 + 面包屑保留在服务端 HTML（满足 §15.1）。

---

## 5. Forensic Pop 视觉系统（需求 §5）

### 5.1 设计令牌

- 背景：骨白 `#F4F0E8`、纯白 `#FFFFFF`、墨黑 `#151515`、深灰 `#2A2A2A`。
- 强调：荧光证据绿 `#C8FF3D`、电光蓝 `#275DFF`、珊瑚警告红 `#FF5C55`、明亮黄 `#FFD84D`、灰紫不确定 `#8B86A8`。

### 5.2 语义色规则（强制，写入样式注释与评审清单）

| 颜色 | 语义 |
|------|------|
| 绿 | 发现可验证信号 |
| 蓝 | 中性文件信息 |
| 黄 | 弱信号 / 需要注意 |
| 红 | 签名失效 / 字段冲突 / 异常 |
| 灰紫 | 无法判断 / 不确定 / 未发现 |

**禁止**绿=真人 / 红=AI。

### 5.3 字体

- 标题：粗体、略带个性的无衬线。
- 正文：高可读现代无衬线。
- 等宽字体用于：文件名、哈希、元数据字段、JSON、EXIF 路径、C2PA 字段、MP4 Box、时间戳、生成参数。

### 5.4 组件命名（需求 §5.5）

Evidence Card / Case File / Signal Receipt / Platform Fingerprint / Evidence Layer / Chain of Origin / Test Record / File Anatomy / Signal Status。

### 5.5 图形与动效（需求 §5.6/§5.7）

- 图形以文件/证据/来源链/传播过程为主，少量扁平人物仅表达情绪。
- 推荐动效：文件拖入逐层打开、元数据字段依次出现、来源链连接、证据逐层消失、结果卡像小票打印。
- 禁止：持续漂浮粒子、影响阅读的视差、延迟操作的开场动画、重型 3D。
- **所有动效遵守 `prefers-reduced-motion`。**

---

## 6. 首页（需求 §7，仅 Phase 1 模块）

### 6.1 本阶段构建

| 模块 | 需求 | 说明 |
|------|------|------|
| Hero | §7.1 | 主标题「别问它"像不像 AI"，看看它留下了什么」；上传入口在首屏；隐私说明；主按钮"拖入原始文件"+ 次按钮"先拆一个真实样本"；**首屏禁止广告** |
| File Anatomy | §7.2 | 上传区旁的 `sample.png` 逐层解剖视觉 |
| 滚动叙事一 | §7.4 | 证据如何在传播中消失（静态教育，CSS+IO） |
| 滚动叙事二 | §7.5 | 文件五层解剖，每层可点开查看真实字段示例 |
| 平台指纹区 | §7.6 | 胶囊 UI，点击进入现有 `/platforms/*`；标注"支持研究的平台"，不伪造合作 |
| 方法论与限制 | §7.9 | 可检查 / 不能保证 两栏 |
| 广告规则 | §7.10 | 见 §10 本文档 |

### 6.2 数据依赖模块（建结构，数据后补）

- §7.3 真实样本体验、§7.7 最新实验：构建 UI + **JSON 数据 schema**（见下），未提供真实数据前显示"即将上线"占位，**不展示虚构数据**。
- §7.8 鉴别挑战：**Phase 3，不做**。

样本/实验数据 schema（示意，置于 `web/src/data/`）：

```json
// sample.json 单条
{ "id", "title", "platform", "fileFormat", "processed": bool,
  "source", "testDate", "signals": [...], "knownLimits": [...], "fileRef": "/samples/.." }
// experiment.json 单条
{ "id", "platform", "testDate", "fileFormat", "sampleCount",
  "mainFindings", "resultChanged": bool, "detailUrl" }
```

---

## 7. Signal Receipt（需求 §10）

- 布局：`AICheck365 — SIGNAL RECEIPT`，含 File / Checked / Processing(Local browser only) / 各信号状态 / Conclusion / Disclaimer。
- 导出（全部**本地生成**）：
  - **JSON**（直接序列化）
  - **PNG**（Canvas 渲染小票）
  - **复制文字摘要**、**复制引用格式**
  - **分享卡**（不含原文件、不含私密元数据）
  - **PDF**：用打印样式表（`@media print`）+ 浏览器打印，避免引入重型 PDF 依赖
- 未经用户主动同意，**不**上传原始文件或完整私密元数据。生成公开分享链接需二次确认。

---

## 8. 方法论页 + 隐私页

- 新增 `/methodology/`（需求 §7.9/§14）：可检查项 / 不能保证项；口号「证据比感觉重要。透明比百分比重要。」
- 更新 `/privacy/`（需求 §17）：文件是否上传、哪些本地完成、是否保存文件/结果、是否收集元数据、如何删除数据；明确分析统计排除项（见 §9）。

---

## 9. i18n（全 9 种语言）

- 新文案集中到按区块组织的字典（Hero / 四状态 / Receipt / 方法论 / 叙事 / 决策树），避免现有"各页面重复 copy 对象"模式蔓延到新内容。
- 9 种语言全部人工质量翻译，**不半翻译**；遵守需求 §15.6（自引用 canonical、双向 hreflang、x-default 已具备，沿用）。
- 这是本阶段**最大的内容工作量**，是排期主驱动项。

---

## 10. 广告规则（需求 §7.10/§16）

- 禁止广告位置：首屏、上传组件周围、文件选择按钮附近、检测进度区、结果结论附近、导出按钮附近。
- 允许位置：方法论介绍之后、平台入口之后、知识文章列表中段、页面底部。
- 广告容器**预留高度**避免跳动；明确标注；不伪装成检测/下载按钮；非首屏延迟加载。
- 沿用现有 AdSense 占位符机制，仅调整位置与预留高度。

---

## 11. 分析事件（需求 §18）

- 新增匿名事件：`sample_opened`、`upload_started`、`analysis_started`、`analysis_completed`、`analysis_failed`、`result_status_viewed`、`evidence_card_expanded`、`expert_mode_enabled`、`report_exported`、`platform_page_clicked`、`related_guide_clicked`、`ad_viewable`。
- **绝不**发送：原始文件、原始文件名、完整 EXIF、GPS、完整 Prompt、私密元数据、文件哈希。

---

## 12. SEO / 可访问性（需求 §15/§19）

- 新页面（methodology 等）：唯一 Title/Description/H1、清晰 H2/H3、canonical、OG、Twitter Card、面包屑、内部链接、JSON-LD（与可见内容一致，不造假评分）。
- 结构化数据：首页 `WebApplication`/`WebSite`/`Organization`（沿用），方法论用 `Article`/`FAQPage`，面包屑 `BreadcrumbList`。
- 可访问性：键盘操作、表单标签、状态不只靠颜色（徽章带文字+图标）、对比度、屏幕阅读器、`prefers-reduced-motion`、错误可读可恢复。
- JS 失败时静态可见：主题、工具说明、支持格式、使用方法、FAQ、方法论、相关链接。

---

## 13. 文件清单（新增/修改）

**Rust 引擎**
- `Cargo.toml`（wasm 依赖加 c2pa）
- `src/`（新增 `verify_c2pa` wasm 接口；`analyzeMedia` 报告加 `provenance`）

**前端**
- 新增：`web/public/tokens.css`、`web/src/scripts/{state,render,receipt,history}.js`、`web/src/pages/methodology.astro`、`web/src/data/{samples,experiments}.json`、首页新区块组件（File Anatomy / 滚动叙事 / 平台指纹 / 方法论）
- 修改：`web/public/style.css`、`web/src/scripts/main.js`→`detect.js`、`web/src/components/Detector.astro`、`web/src/pages/index.astro`、`web/src/pages/privacy.astro`、`web/src/layouts/Base.astro`（导航/令牌引入）、`web/public/scripts/i18n.js` + `locales/*.yml`（新文案 9 语言）

---

## 14. 验收标准（映射需求 §22，本阶段相关项）

1. 首屏可理解网站用途，并说明文件本地处理。
2. 用户无需上传也能体验真实样本（**依赖用户提供样本数据；未提供前为占位**）。
3. 结果不只显示一个 AI 概率。
4. 结果区分 A/B/C/D 四状态。
5. "未发现信号"不被描述为"真人创作"。
6. 结果页提供下一步调查建议。
7. 可导出不含原文件的 Signal Receipt。
8. 核心页面正文可被搜索引擎直接读取。
9. 上传区与主要结果附近无广告。
10. 广告不造成明显跳动。
11. 移动端可顺利完成上传、检测、结果阅读。
12. 多语言无明显混合语言。
13. 用户文件与敏感元数据不进入普通分析统计。
14. 所有结论附带适用范围与限制说明。
15. 页面间存在清晰内部链接。

---

## 15. 关键风险汇总

1. **c2pa-rs wasm 集成**（§3.3）—— 最高风险，需先验证编译与体积。
2. **9 语言翻译工作量**（§9）—— 排期主驱动。
3. **样本/实验真实数据缺失**（§6.2）—— UI 先行，数据由用户后补，期间用占位避免造假。
4. **全站视觉改版**（§5）—— 范围大，需保证 dark/light 与可访问性不退化。

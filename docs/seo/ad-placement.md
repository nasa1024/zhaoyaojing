# 广告位规划（AdSense 未接入，仅预留）

所有广告位统一用 `web/src/components/AdSlot.astro`：固定标签（9 种语言的“广告”）、预留高度、主题自适应、无阴影/实线边框（避免被当成内容）。接入时只需在组件里取消注释 `ins.adsbygoogle`，并在 `Base.astro` 打开 AdSense 脚本。

## 当前位置

| placement | 页面 | 形态 | 说明 |
|---|---|---|---|
| `after-detector-results` | 首页 | 横幅，≥90px | 检测器区块之后，隔着“历史记录”，不贴上传区和结果卡 |
| `after-methodology` | 首页 | 横幅，≥90px | 方法论之后，所有核心内容读完 |
| `article-rail` | 文章页（SynthID、Claude） | 300×250/600 粘性侧栏 | 仅 ≥1181px 显示，随阅读固定 |
| `article-inline` | 文章页 | 正文内横幅，≥250px | 仅 ≤1180px 显示（侧栏隐藏时），置于对比表之前 |

同一屏最多出现一个大尺寸广告：宽屏用侧栏，窄屏用正文内。

## 规则

- 首屏和上传区附近不放广告；`#tool-inspector` 内不放广告（`tests/consent-ads.spec.js` 已固化）。
- 不紧贴 CTA 按钮、检测结果卡、表单控件，避免误点击。
- 空占位只显示斜纹，真实广告出现（`ins.adsbygoogle`）后高度自动升到 250px，减少版面跳动。
- Consent Mode v2 已在 `Base.astro` 配置；欧盟地区默认拒绝，用户选择后更新。

## 后续可加

- 平台指南页（`LocalizedContentPage.astro`）正文中段一个 `article-inline`；该模板 6700 行，改动前先抽出文章版式。
- 博客索引第二行与第三行卡片之间加一个信息流位（`in-feed`），用 `.blog-grid` 的 `grid-column: 1 / -1`。

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
- 空占位默认状态：当 `<AdSlot>` 默认插槽未传入真实广告或合作方卡片内容时，组件渲染 `data-ad-state="empty"`，并由 `polish.css`（`.ad-slot[data-ad-state="empty"] { display: none; }`）隐藏，防止合作方/品牌审核（如 Impact 审核）和普通访客看到空白斜纹“ADVERTISEMENT”占位框；`lang-init.js` 也只监听非空激活槽位（`.ad-slot:not([data-ad-state="empty"])`，并暴露 `window.__AICHECK_OBSERVE_AD_SLOTS__`），避免向 GA4 误报 `ad_viewable`。
- 激活与预留高度：一旦接入 AdSense（`ins.adsbygoogle`）或向默认插槽填入合作方卡片，组件会输出 `data-ad-state="active"` 并恢复可见展示，保留边框、标签及预留高度（常规横幅 `min-height >= 90px`，矩形/`ins.adsbygoogle` 为 `250px`），减少版面跳动（CLS）。
- Consent Mode v2 已在 `Base.astro` 配置；欧盟地区默认拒绝，用户选择后更新。

## 后续可加

- 平台指南页（`LocalizedContentPage.astro`）正文中段一个 `article-inline`；该模板 6700 行，改动前先抽出文章版式。
- 博客索引第二行与第三行卡片之间加一个信息流位（`in-feed`），用 `.blog-grid` 的 `grid-column: 1 / -1`。

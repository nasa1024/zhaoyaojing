# AICheck365 网站排名优化方案

> 现状核查日期：2026-07-04
> 站点：https://www.aicheck365.com （Cloudflare Workers Assets 部署，Astro 静态站）
> 结论先行：**站内技术 SEO 已经相当完善，当前排名的瓶颈不在代码，而在「收录/权威度/内容量」**。品牌词 `aicheck365.com` 在搜索引擎中目前搜不到任何结果，说明站点基本未被收录或权重极低。方案重心：P0 收录与基建修补 → P1 内容扩张 → P2 外链与权威度建设。

---

## 一、当前状态核查结果

### 1.1 已经做得好的（无需重做）

| 项目 | 状态 |
| --- | --- |
| 静态 SSR 渲染 | ✅ 所有页面构建期输出完整 HTML，首页可见文本约 8300 字符，不依赖 JS 渲染 |
| canonical / hreflang | ✅ 每页自引用 canonical，9 语言 hreflang + x-default，OG locale alternate 齐全 |
| sitemap | ✅ `@astrojs/sitemap` 生成 sitemap-index，线上共 252 个 URL，全部可访问 |
| robots.txt / llms.txt | ✅ 开放 Googlebot/Bingbot/GPTBot/ClaudeBot/PerplexityBot 等，含 Sitemap 声明 |
| 结构化数据 | ✅ Organization、WebSite、WebApplication、Article、FAQPage、BreadcrumbList 均有输出 |
| 元数据质量门禁 | ✅ `scripts/seo-qa.mjs` 在 build 时校验 title/description/canonical/内链/混语言 |
| 性能基础 | ✅ 9MB WASM 为懒加载（用户拖入文件才加载），静态资源 Brotli 压缩，首页 HTML 约 40KB |
| 分析与合规 | ✅ GA4 + Consent Mode v2，EEA 默认 denied |

### 1.2 发现的问题（按严重程度排序）

1. **搜索可见度为零（最核心问题）**：搜索 `"aicheck365.com"` 无任何结果。新域名（2026 年上线）、外链几乎为零、CrUX 无数据（真实流量过低）。这不是站内代码问题，需要收录提交 + 外链建设解决。
2. **裸域未 301**：`https://aicheck365.com/` 直接返回 200 完整页面，而不是 301 到 `www.aicheck365.com`，形成全站双主机重复内容（canonical 只能部分缓解，会分散抓取预算和信号）。Workers Assets 的 `_redirects` 只支持路径匹配，无法按 host 匹配，**需在 Cloudflare 控制台配置 Redirect Rule**。
3. **sitemap 缺少 `lastmod`**：当前只输出 `changefreq`/`priority`（Google 已声明基本忽略这两项），唯一被 Google 采信的 `lastmod` 反而没有。影响新内容/更新内容的抓取优先级。
4. **首页 H1 是口号而非关键词**：H1 为「别问它"像不像 AI"，看看它留下了什么」，主关键词（AI 图片检测 / AI image detector）只出现在 kicker 小字里。各语言版首页同理。
5. **内容体量太薄**：仅 6 篇博客（每篇正文约 4000–5000 字符），252 个 URL 里绝大多数是同一批 26 个页面的 9 语言翻译。真正能承接长尾搜索意图的页面很少。
6. **收录提交状态不明**：仓库和站点内没有 Google Search Console / Bing Webmaster 验证痕迹（可能用 DNS 验证，需确认）。没有 IndexNow。
7. 小问题：`public/sitemap.xml` 与生成的 `sitemap-index.xml` 内容重复且 robots.txt 同时声明两个；robots.txt 里的 `Host:` 指令是 Yandex 专用旧语法（无害）；`meta keywords` 已无排名作用（无害，可留可删）。

### 1.3 需要老板拍板的战略问题

- **默认语言 = zh-CN，但 Google 在中国大陆不可用**。当前 x-default 指向中文根路径。如果主要获客市场是海外（Google/Bing），建议把 **x-default 指向 `/en/`**，或者干脆把英文提升为根路径默认语言；如果确实要做中文市场，则需要单独做 Baidu 站长平台提交（Cloudflare 托管站在百度收录慢，且无 ICP 备案会受限）。**本方案默认按「英文优先、Google/Bing 为主战场」执行**，如判断不同请调整。

---

## 二、优化方案

### P0：本周完成（收录基建，工程量小、收益确定）

| # | 任务 | 类型 | 具体做法 |
| --- | --- | --- | --- |
| P0-1 | 裸域 301 | Cloudflare 控制台 | Rules → Redirect Rules：`aicheck365.com/*` → `https://www.aicheck365.com/$1`，301 永久 |
| P0-2 | GSC + Bing 验证与提交 | 控制台 | Google Search Console（域名级 DNS 验证）+ Bing Webmaster Tools（可直接从 GSC 导入），提交 `sitemap-index.xml`，对首页/工具页/6 篇博客手动请求编入索引 |
| P0-3 | sitemap 加 `lastmod` | 代码 | `astro.config.mjs` 的 sitemap 集成加 `lastmod`（serialize 钩子按内容注册表的更新时间输出）；同时删掉无效的 changefreq/priority |
| P0-4 | 接入 IndexNow | 代码 | 生成 IndexNow key 文件放 `public/`，发布流程（deploy workflow）里对变更 URL ping Bing/Seznam/Yandex，Bing 收录立即生效 |
| P0-5 | 首页 H1 优化 | 代码 | H1 改为含主关键词的句式（如 zh:「AI 图片/视频检测——看它留下了什么证据」，en:「AI Image & Video Detector — see what the file left behind」），口号降级为副标题；同步改 9 语言 i18n 文案与 seo-qa 断言 |
| P0-6 | sitemap/robots 清理 | 代码 | 删除 `public/sitemap.xml`，robots.txt 只保留 `sitemap-index.xml` 一条声明，去掉 `Host:` |
| P0-7 | x-default 指向决策落地 | 代码 | 老板确认市场方向后，把 x-default 从 `/` 改为 `/en/`（或维持现状） |

**P0 验证方式**：`curl -I https://aicheck365.com/` 返回 301；GSC 覆盖率报告出现「已编入索引」页面；`npm run build` 后 sitemap 含 lastmod；seo-qa 全绿。

### P1：2–6 周（内容扩张——排名的真正燃料）

现有内容结构（工具页 + 平台页 + 6 篇文章）是好骨架，但承接不了足够的搜索意图。按以下四条线扩充，**优先英文，每篇发布后翻译到已上线语言**：

1. **长尾问答型文章**（每周 2–3 篇，目标 8 周内 +20 篇）。选题直接对准真实搜索 query，示例：
   - "How to tell if an image is AI-generated (2026 guide)"
   - "Does Sora watermark its videos? How to check"
   - "How to verify Content Credentials on a photo"
   - "Why screenshots lose AI metadata (and what survives)"
   - "Is this Midjourney? File-name and XMP patterns explained"
   - 中文对应：「怎么判断图片是不是 AI 生成的」「Sora 视频有水印吗」等
2. **场景/人群落地页**：记者核查图片、电商平台审核商品图、老师检查学生作业图、保险理赔照片验真、约会软件头像验真。每页 = 场景痛点 + 操作步骤 + 工具 CTA + 场景 FAQ（FAQPage schema）。
3. **对比页（高转化 + 抢竞品词）**："AICheck365 vs AI or Not / Hive Moderation / Illuminarty / WasItAI"，突出差异点：**本地检测不上传文件、基于可解释的 provenance 证据而非黑盒打分、免费无次数限制**。
4. **数据型可引用内容（为 P2 外链服务）**：把 `/research/` 实验中心做成「AI 平台元数据留存追踪报告」——定期实测各平台（Gemini/Sora/Midjourney/Kling…）导出文件的 C2PA/EXIF 留存情况并出对照表。这类第一手数据是记者和博主最愿意引用的外链磁铁。

**内容规则**（延续现有 QA 门禁）：每篇注册进 `articles.json`；title ≤70 字符含目标 query；正文 ≥1200 词（英文）；至少 3 条内链（工具页/平台页/相关文章互链）；文章页输出 `datePublished`/`dateModified` 并保持真实更新。

### P2：持续进行（权威度与外链——决定天花板）

新域名没有外链，站内做得再好也排不上去。按投入产出排序：

1. **产品发布渠道**：Product Hunt、Hacker News（Show HN，强调 browser-local/WASM/隐私角度，技术社区吃这套）、r/artificial、r/StableDiffusion、V2EX/少数派（中文）。
2. **工具目录提交**：AlternativeTo、There's An AI For That、Futurepedia、SaaSHub、AI 工具导航站（中英各 10+ 个），每个都是一条外链。
3. **GitHub 借力**：开源仓库 README 显著放官网链接；在 awesome-list（awesome-ai-tools、awesome-c2pa 类）提 PR 收录。
4. **社区与行业**：C2PA/CAI（Content Authenticity Initiative）社区参与；数字取证、新闻核查（fact-checking）社区分享检测方法文章；给报道 AI 造假事件的记者提供免费检测协助换取署名引用。
5. **可引用资产**：P1-4 的平台元数据留存报告，每季度更新一次并主动推给相关媒体/Newsletter。

### 度量与节奏

- **每周**：GSC 覆盖率（已收录页数）、展示量、点击量、平均排名；Bing Webmaster 同项。
- **跟踪 20 个核心 query**（如 ai image detector、c2pa checker、check if image is ai、sora watermark、怎么判断图片是AI生成的……）的排名变化。
- **北极星指标**：自然搜索会话数 → 检测完成事件（GA4 `analysis_complete`，已埋点）。
- **预期**：P0 后 2–4 周品牌词可搜到、核心页开始收录；P1 内容满 20 篇 + P2 首批外链后 2–3 个月长尾词进入前 50；6 个月内争取 3–5 个长尾词进前 10。新站在 Google 有沙盒期，前 3 个月看收录和展示量而不是排名本身。

---

## 三、任务清单（可直接派单）

- [ ] P0-1 Cloudflare 裸域 301（控制台，5 分钟）
- [ ] P0-2 GSC + Bing 验证、sitemap 提交、手动请求收录（控制台，1 小时）
- [ ] P0-3 sitemap lastmod（代码）
- [ ] P0-4 IndexNow 接入（代码 + deploy workflow）
- [ ] P0-5 首页 H1 九语言优化（代码）
- [ ] P0-6 sitemap/robots 清理（代码）
- [ ] P0-7 x-default 市场决策 + 落地（先拍板）
- [ ] P1 内容排期表（第 1 批 6 篇英文选题先行）
- [ ] P2 Product Hunt / HN 发布计划与目录提交清单

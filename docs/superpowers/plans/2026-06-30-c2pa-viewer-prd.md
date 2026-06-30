# PRD: C2PA Viewer - Minimalist C2PA Manifest Extractor

## 1. Executive Summary

- **Problem Statement**: Developers, security researchers, and content auditors need a quick, distraction-free way to verify C2PA signatures and extract the underlying raw JSON manifest data locally without visual overhead or complex interpretation charts.
- **Proposed Solution**: Launch a dedicated `/tools/c2pa-viewer/` single page (and `/en/tools/c2pa-viewer/` for English) featuring a minimalist upload interface that renders only the formatted raw JSON manifest returned by the C2PA parser.
- **Success Criteria**:
  - Static generation (SSG) of default (zh-CN) and English routes.
  - Successful validation by build-time check `node scripts/seo-qa.mjs`.
  - Playwright integration tests confirming correct file drop, raw JSON rendering, search filter functionality, and export logic.
  - Adherence to the existing zero-upload privacy model and analytics allowlist.

## 2. User Experience & Functionality

- **User Personas**:
  - **AI Content Auditors / Developers**: Want to check if their custom C2PA signing libraries are producing correct assertions and structures.
  - **Forensic Investigators**: Need the exact cryptographic metadata records in raw JSON format to store as verifiable evidence.
- **User Stories**:
  - *As an auditor, I want to drag a signed photo onto the browser page so I can immediately view the raw manifests JSON list without scrolling through visual tabs.*
  - *As a developer, I want to search through keys and values inside the raw C2PA JSON block to quickly check specific metadata parameters.*
- **Acceptance Criteria**:
  - The tool uses the existing Rust/WASM library to extract C2PA manifest.
  - UI displays an upload box, followed by standard action buttons (Copy JSON, Export JSON) and a search/filter input.
  - The output renders only the formatted JSON string in a `<pre class="tool-raw-json mono">` element.
  - Registered in `src/data/content/tools.json` and visible on the `/tools/` and `/en/tools/` hubs.
  - The hreflang alternate links and canonical headers align perfectly with standard layouts.
- **Non-Goals**:
  - Re-rendering human-friendly diagrams, trust anchors, or visual confidence badges. Those belong to `/tools/c2pa-validator/`.
  - Storing uploaded media files or report logs on server systems.

## 3. Technical Specifications

- **Routing & Pages**:
  - Route (default): `web/src/pages/tools/c2pa-viewer.astro`
  - Route (English): `web/src/pages/[lang]/tools/c2pa-viewer.astro`
  - React/Astro Island: `src/components/tools/C2paViewerPage.astro` using `Layout` or `Base` layout.
- **Tool Configuration in `tool-inspector.js`**:
  - Config key: `'c2pa-viewer'`
  - Call method: `verifyC2pa(bytes, mime)`
  - Renders raw JSON in a `<pre>` block.
- **Registry Registration**:
  - Registered in `web/src/data/content/tools.json` as `c2pa-viewer-zh` and `c2pa-viewer-en`.
- **Sitemap & SEO Metadata**:
  - Title (ZH): `C2PA 查看器：提取 AIGC 图片视频原始凭证 | AICheck365`
  - Description (ZH): `C2PA 查看器：在浏览器本地解析并查看图片与视频的 C2PA Content Credentials 原始 JSON 结构。支持复制与导出，不上传文件。`
  - Title (EN): `C2PA Viewer: Extract Raw Content Credentials JSON | AICheck365`
  - Description (EN): `C2PA Viewer: inspect and extract raw C2PA manifests JSON locally in your browser. Copy or export raw Content Credentials without uploading files.`

## 4. Verification Plan

- Run build: `npm run build` and ensure `seo-qa.mjs` passes without warnings.
- Run tests: Playwright test suite additions in `web/tests/tools.spec.js` asserting that the new viewer can verify the signed sample and render raw JSON.

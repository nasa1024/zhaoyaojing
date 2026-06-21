# AICheck365 SEO / AdSense PRD Task Breakdown

> Source PRD: `/Users/nasa1024/Downloads/AICheck365_SEO_AdSense_PRD.md`  
> Repo review date: 2026-06-21  
> Current implementation slice: PRD P0/P1 tool coverage

## Current Code Baseline

- Already present: browser-local Rust/WASM detector, homepage upload flow, C2PA validator, platform pages, blog pages, methodology/privacy/terms/contact pages, samples, experiments data, sitemap/robots/llms, GA4/AdSense placeholders, Playwright coverage.
- Main PRD gaps still open: full non-English tool localization beyond English, structured content collections, consent management, analytics dashboards, research center, broad language QA.
- Tool URL architecture now supports root zh-CN URLs and English `/en/tools/*` URLs. Do not generate other locale tool URLs until those pages have reviewed language-specific copy.

## Task Slices

### Slice 1: Dedicated Metadata Tools

Status: implemented in this pass.

- EXIF/XMP reader at `/tools/exif-xmp-reader/`
- PNG parameter/workflow extractor at `/tools/png-parameter-extractor/`
- MP4/MOV metadata inspector at `/tools/mp4-metadata-inspector/`
- Shared raw inspector rendering, search, safe copy, full JSON export, sensitive-field warning.
- WASM exports for `inspectExifXmp`, `inspectPngMetadata`, and `inspectMp4Metadata`.
- Tools hub, sitemap, canonical, SSR fallback copy, JSON-LD, and Playwright coverage.

### Slice 2: Localized Tool URL Architecture

Status: implemented for English; other locales remain gated on translation QA.

- Existing root URLs remain live as zh-CN/default pages.
- Added English static paths for `/en/tools/`, `/en/tools/c2pa-validator/`, `/en/tools/exif-xmp-reader/`, `/en/tools/png-parameter-extractor/`, and `/en/tools/mp4-metadata-inspector/`.
- Tool pages emit only available `zh-CN` and `en` hreflang alternates; sitemap includes English tool URLs and omits missing locales such as `/es/tools/*`.
- Header/footer navigation points to `/en/tools/` on English pages and keeps `/tools/` for locales whose tool pages are not ready.
- Language switch preserves supported English tool paths and returns unsupported tool locales to the locale homepage instead of a 404.
- Added Playwright coverage for English server-rendered copy, localized hub links, sitemap, canonical/hreflang, and language switch behavior.

### Slice 3: Priority SEO Landing Pages

Status: implemented for the initial P0 query set.

- Strengthened `/en/platforms/sora/`, `/en/platforms/gemini/`, `/en/platforms/comfyui/`, `/de/blog/how-to-detect-ai-videos/`, and `/pt-BR/blog/how-to-detect-ai-images/`.
- Added direct first-screen answers, target-query metadata, tested date / parser version, sample-status tables, signal tables, known limits, FAQ JSON-LD, and tool CTAs.
- Kept missing Sora and Gemini image samples honest: pages explicitly state when a licensed direct sample is not yet bundled instead of inventing results.
- Added `web/tests/seo-priority.spec.js` coverage for the P0 pages, tool CTA routing, sample-backed content, and unavailable localized tool route avoidance.
- Remaining follow-up: add licensed direct Sora and Gemini image samples when available, then update these pages from "sample status" to measured sample output.
- Guard against keyword cannibalization: tool pages own viewer/checker/extractor terms; platform pages own platform + detector/metadata terms; articles own how-to/what-is terms.

### Slice 4: C2PA Validator Upgrade

Status: implemented in this pass.

- Keep current raw manifest display.
- Add clearer separation between signature validity, trust roots, hash mismatch, expired certificate, unknown issuer, and no manifest.
- Add fixture coverage for valid, expired, tampered, and no-manifest examples using real samples.
- C2PA result pages now show a status summary that separates manifest presence, signature validity, trust status, and problem summary before the raw manifest.
- Playwright coverage exercises the signed Adobe sample, expired OpenAI sample, tampered fixture, and no-manifest fixture on the browser-local validator.

### Slice 5: Analytics And Privacy Events

Status: implemented for tool pages in this pass.

- Define GA4 allowlist for tool views, file category, mime group, completion bucket, sanitized error, copy/export.
- Ensure no file name, prompt, metadata value, GPS, hash, raw stack, or certificate serial leaves the browser.
- Add tests around event payload filtering for new tools.
- Tool pages now emit PRD-aligned `detector_view`, `file_select`, `analysis_start`, `analysis_complete`, `analysis_error`, `copy_result`, and `export_result` events with only enumerated or bucketed parameters.
- Added Playwright coverage that verifies the event allowlist and blocks private file/sample data from GA payloads.

### Slice 6: Content Collections And QA

Status: implemented in this pass.

- Introduce Astro content collections for tools, platforms, articles, experiments, and samples.
- Add build-time checks for title, description, canonical, draft, duplicate title, and missing internal links.
- Add language QA checks for mixed-language body text on priority locales.
- Added `src/content.config.ts` with schemas for tools, platforms, articles, experiments, and samples.
- Added registered content data for live tools, priority platforms, and priority articles.
- Added `scripts/seo-qa.mjs` and wired it into `npm run build` to validate registered pages against built HTML.
- Added localized methodology routes so existing localized navigation and English tool links resolve.

### Slice 7: Research Center

Status: implemented in this pass.

- Add `/research/` index and experiment pages.
- Use fields from the PRD: platform, sample count, source/license, testedAt, parserVersion, browser/system, expected/actual signals, misses, limitations, reproducible steps.
- Link research pages back into platform pages and tool pages.
- Extended `experiments.json` with research fields and internal research URLs.
- Added `/research/` plus `/research/[id]/` pages backed by the same experiment/sample data.
- Updated home experiment cards to link to internal research notes and added sitemap/field/link coverage.

### Slice 8: AdSense And Consent Hardening

Status: implemented in this pass.

- Add a consent management approach for EEA/UK/CH traffic before expanding ads.
- Keep tool-page ads away from upload controls and result actions.
- Add fixed-height ad slots to avoid CLS, then measure RPM against detection-start and completion rates.
- Added Google Consent Mode v2 defaults before `gtag.js`: EEA/UK/CH-like visits detected by locale/timezone default to denied until a choice is made.
- Added a privacy choices banner, `consent_update` event with grouped state only, and updated the privacy policy copy.
- Kept AdSense script disabled, added fixed-height ad-slot placement attributes, and added tests that dedicated tool pages have no ad slots inside upload/result controls.

## Verification Commands

- `cargo check --target wasm32-unknown-unknown`
- `wasm-pack build --target web --out-dir web/public/pkg`
- `npm run build` from `web/`
- `npm test` from `web/`
- `cargo test --lib`
- Full `cargo test` requires real Git LFS fixtures; pointer files will make the fixture-heavy integration tests fail.

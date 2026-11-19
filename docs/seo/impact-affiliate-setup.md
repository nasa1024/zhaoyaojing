# Impact.com Affiliate Setup & Activation Runbook

This runbook covers the manual external console prerequisites, safe partner activation through the first-party `/go/<slug>` Cloudflare Worker redirector, disclosed link markup, and end-to-end verification in GA4 and Impact.com.

## Architecture Overview

- **First-party redirector (`web/worker.js` + `web/affiliate-links.js`):** Requests to `/go/<slug>` are handled by `affiliateRedirect(request, env)` right after `canonicalRedirect(request)` and before `env.ASSETS.fetch(request)`.
- **Fail-closed defaults:** All placeholder entries in `AFFILIATE_PARTNERS` (`adobe-firefly`, `canva`, `elevenlabs`) ship with `enabled: false` and empty `url` strings so no unapproved or dummy external link can ever live-redirect.
- **Noindex & security headers:**
  - `web/public/robots.txt` blocks `/go/` (`Disallow: /go/`).
  - Enabled `/go/<slug>` redirects return `302` with `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store, private`, `Referrer-Policy: no-referrer-when-downgrade`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security: max-age=31536000` on `www.aicheck365.com`.
  - Unknown, disabled, or invalid `/go/...` requests return `404 Not Found` with `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store, private`, and `X-Content-Type-Options: nosniff`.
- **Consent-gated Impact.com STAT tag:** `Base.astro`, `ToolBase.astro`, and `web/public/scripts/consent.js` defer `https://utt.impactcdn.com/P-A8151808-6473-4831-b4b6-3341eeb5b97c1.js` until after `window` `load` (via `requestIdleCallback`) for non-EEA visitors, and block loading for EEA/UK/Switzerland visitors until `granted_all` consent is chosen.
- **Empty ad slots hidden:** `<AdSlot />` defaults to `data-ad-state="empty"` (`display: none`) until populated by AdSense or an approved partner card, keeping pages clean during Impact brand reviews.

---

## Step 1: Three Manual External Console Prerequisites

Complete these three external console checks before enabling live affiliate links:

1. **Dedicated clean GA4 property for `www.aicheck365.com`:**
   - Currently `web/src/layouts/Base.astro` and `web/src/layouts/ToolBase.astro` point to `G-8RF8YQ5YB1`.
   - Ensure `www.aicheck365.com` uses a clean, dedicated GA4 property and Web Data Stream (separate from any legacy upstream/dev traffic) with internal/preview hostnames (`*.workers.dev`, `localhost`) excluded via GA4 data filters.
   - If switching to a new Measurement ID, update `G-8RF8YQ5YB1` in both `web/src/layouts/Base.astro` and `web/src/layouts/ToolBase.astro`.
2. **Cloudflare AI crawler unblock:**
   - In the Cloudflare dashboard (**Security -> Bots / WAF**), verify Bot Fight Mode, Super Bot Fight Mode, and custom WAF rules do **not** block search or AI answer-engine crawlers allowed in `web/public/robots.txt` (`Googlebot`, `Bingbot`, `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `Claude-User`, `Claude-SearchBot`, `PerplexityBot`, `Google-Extended`, etc.).
   - Confirm `https://www.aicheck365.com/llms.txt` and `https://www.aicheck365.com/llms-full.txt` return `200 OK` to crawler user-agents while `/go/` remains disallowed in `robots.txt` and marked `noindex, nofollow` by `worker.js`.
3. **Geo-matched Impact.com brand selection (`TW / JP / KR / DE / EN`):**
   - Apply for and secure Impact.com campaign approvals tailored to AICheck365's highest-value geographies (`zh-TW`, `ja`, `ko`, `de`, and `en`), matching local landing pages, currencies, and creative/AI workflows (for example, localized Adobe Firefly / Creative Cloud, Canva, ElevenLabs, or regional partner programs).
   - Never enable a `/go/<slug>` entry until the brand has approved your `www.aicheck365.com` media property in Impact.com and issued an official tracking link.

---

## Step 2: Activate an Approved Impact.com Partner

In Impact.com (**Create Link**), generate the approved `https://` tracking URL for your target brand and landing page. You can activate it either in version-controlled code or at runtime via Worker environment configuration.

### Option A: Update `web/affiliate-links.js` (Version-Controlled)

Edit the partner entry in `AFFILIATE_PARTNERS` inside `web/affiliate-links.js`:

```js
'adobe-firefly': Object.freeze({
  url: 'https://imp.i12345.net/c/1234567/890123/4567?u=https%3A%2F%2Fwww.adobe.com%2Fproducts%2Ffirefly.html',
  enabled: true,
  subIdParams: Object.freeze({ ...DEFAULT_SUB_ID_PARAMS }),
}),
```

- Keep `url` strictly `https://` with no embedded credentials. Existing query parameters (such as `u=...`) are preserved automatically.
- Only customize `subIdParams` if a specific non-Impact or custom campaign uses different query parameter keys than `subId1`, `subId2`, and `subId3`.
- Validate locally before deploying:

```bash
cd web && npm run test:worker
```

### Option B: Override at Runtime with `AFFILIATE_LINKS_JSON` (No Rebuild)

Set `AFFILIATE_LINKS_JSON` in Cloudflare Workers (**Settings -> Variables and Secrets**, or via Wrangler) to enable, rotate, or disable partner URLs without redeploying static assets:

```json
{
  "adobe-firefly": {
    "url": "https://imp.i12345.net/c/1234567/890123/4567",
    "enabled": true,
    "subIdParams": {
      "subId1": "subId1",
      "subId2": "subId2",
      "subId3": "subId3"
    }
  }
}
```

Example Wrangler secret command from the repository root:

```bash
npx wrangler secret put AFFILIATE_LINKS_JSON
```

Any malformed JSON, non-`https:` protocol, or entry without `"enabled": true` fails closed and returns `404 Not Found`.

---

## Step 3: Render Disclosed Affiliate Links

Every page or card displaying an affiliate link must follow both FTC/EU disclosure rules and AICheck365's tracking conventions:

1. **Render `<AffiliateDisclosure />`:** Place `<AffiliateDisclosure lang={lang} />` (or `<AffiliateDisclosure lang={lang} compact />`) directly alongside partner recommendations so visitors see the localized disclosure and `/about/#editorial-independence` link.
2. **Use `/go/<slug>` with required attributes:**
   - `rel="sponsored noopener noreferrer"`
   - `target="_blank"`
   - `data-affiliate-partner="<slug>"`
   - `data-affiliate-placement="<placement>"` (for example `article-inline`, `result-state-c`, `tool-sidebar`)
   - Optional `data-result-state="<A|B|C>"` when triggered inside detector result UI
3. **Pass privacy-safe SubID query parameters:**
   - Pass `?locale=${lang}&placement=${placement}&state=${state}` (or explicit `subId1`, `subId2`, `subId3`, which take precedence over the `locale`/`placement`/`state` aliases).
   - `sanitizeSubId()` trims whitespace and enforces `[a-zA-Z0-9_-]{1,64}`. Any invalid value is dropped (`null`) to block header injection and prevent PII leakage.

Example Astro snippet:

```astro
---
import AffiliateDisclosure from '../components/AffiliateDisclosure.astro';
---

<AffiliateDisclosure lang={lang} compact />
<a
  href={`/go/adobe-firefly?locale=${lang}&placement=article-inline`}
  target="_blank"
  rel="sponsored noopener noreferrer"
  data-affiliate-partner="adobe-firefly"
  data-affiliate-placement="article-inline"
>
  Explore Adobe Firefly
</a>
```

**Never** place file names, file paths, EXIF/GPS data, prompts, hashes, certificate serial numbers, or user identifiers in `subId1`, `subId2`, `subId3`, or any `data-affiliate-*` attribute.

---

## Step 4: Verification Checklist

### 1. Local Worker & Redirect Checks

Run the Worker test suite from `web/`:

```bash
cd web && npm run test:worker
```

After deploying to preview or production, verify headers and SubID forwarding with `curl`:

```bash
curl -i "https://www.aicheck365.com/go/adobe-firefly?locale=zh-TW&placement=article-inline&state=C"
```

Expected response:
- Status `302`
- `Location` points to the approved `https://` Impact tracking URL with existing params preserved and `subId1=zh-TW&subId2=article-inline&subId3=C` appended
- `X-Robots-Tag: noindex, nofollow`
- `Cache-Control: no-store, private`
- `Referrer-Policy: no-referrer-when-downgrade`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000` (on `www.aicheck365.com`)

Also verify an unconfigured/disabled slug returns `404 Not Found` with `X-Robots-Tag: noindex, nofollow`:

```bash
curl -i "https://www.aicheck365.com/go/unconfigured-partner"
```

### 2. GA4 `affiliate_click` Verification

1. Visit a page containing a disclosed `/go/<slug>` link on a non-EEA session (or after accepting the consent banner on `/de/`, `/fr/`, or `/es/`).
2. Click the link and inspect `window.dataLayer` (or GA4 **Admin -> DebugView**).
3. Confirm an `affiliate_click` event is emitted with:
   - `partner` (for example `'adobe-firefly'`)
   - `placement` (for example `'article-inline'`)
   - `result_state` (if `data-result-state` is present)
   - `rel_sponsored: true`
   - Enriched page context from `market-analytics.js` (`page_locale`, `page_type`, `tool_type`, `page_path`, `landing_path`).
4. Confirm EEA/UK/Switzerland sessions before consent (`unset_required` or `essential_only`) do **not** request `utt.impactcdn.com`.

### 3. Impact.com SubID & STAT Tag Verification

1. Trigger a test click using explicit test SubIDs (for example `/go/adobe-firefly?locale=en&placement=verify-setup&state=C`).
2. In Impact.com, open **Reports -> Performance by Sub ID** (and **Action Listing / Clicks**).
3. Confirm the click registers with `Sub ID 1 = en`, `Sub ID 2 = verify-setup`, and `Sub ID 3 = C`.
4. Confirm `impactStat('transformLinks')` and `impactStat('trackImpression')` fire without blocking initial page paint once consent is granted.

# Country Page RPM and detector completion reporting

This workflow joins three export files into one country-level table so SEO decisions can be ranked by both traffic quality and monetization.

## What is measured

- **GA4:** sessions, users, detector starts, detector completions, and detector errors by country.
- **AdSense:** estimated earnings, page views, and calculated Page RPM by country.
- **Google Search Console (optional):** clicks, impressions, CTR, and impression-weighted average position by country.

GA4 and AdSense supply the country dimension. The site does not request GPS or add client-side geolocation. A small analytics context wrapper adds only privacy-safe fields—`page_locale`, `page_type`, `tool_type`, `page_path`, and `landing_path`—to detector events on the new market and localized tool pages.

Both historical event name families are supported:

- Home detector: `analysis_started`, `analysis_completed`, `analysis_failed`
- Dedicated tools: `analysis_start`, `analysis_complete`, `analysis_error`

## Export GA4

Create a GA4 Exploration or report with:

- Dimensions: **Country**, **Event name**
- Metrics: **Event count**, **Sessions**, **Total users**
- Event filter: `analysis_started`, `analysis_completed`, `analysis_failed`, `analysis_start`, `analysis_complete`, `analysis_error`, and optionally `session_start`

Export the result as CSV. The script uses the maximum Sessions/Users value per country so a repeated total on every event row is not double-counted.

## Export AdSense

Open AdSense Reports, select the same date range, and use:

- Dimension: **Country**
- Metrics: **Estimated earnings**, **Page views**, **Page RPM**

Export as CSV. Page RPM is recalculated from total earnings and page views when both values are available.

## Export Search Console (optional)

Export the Country report with:

- Country
- Clicks
- Impressions
- CTR
- Position

Use the same date range as GA4 and AdSense.

## Build the report

From `web/`:

```bash
npm run report:countries -- \
  --ga4 ./exports/ga4-country-events.csv \
  --adsense ./exports/adsense-country.csv \
  --gsc ./exports/gsc-country.csv \
  --out ./reports/country-performance.csv
```

The command writes both CSV and JSON. It accepts common English and Chinese export column names and normalizes frequent ISO country codes such as `USA`, `DEU`, `JPN`, `KOR`, and `TWN`.

## Output fields

| Field | Meaning |
|---|---|
| `analysis_starts` | Sum of both detector start event names |
| `analysis_completes` | Sum of both completion event names |
| `completion_rate` | Completions divided by starts |
| `page_rpm` | AdSense earnings / page views × 1,000 |
| `earnings_per_completion` | Earnings divided by completed analyses |
| `gsc_ctr` | Clicks divided by impressions |
| `gsc_average_position` | Impression-weighted average position |
| `monetization_score` | Page RPM × completion rate × a logarithmic traffic factor; use only for prioritization |

## Recommended dashboard

Use Country as the primary row and add filters for locale, page type, tool type, and landing path. Review at least 28 days of data before changing language priorities. The main decision metric should be **natural-search earnings per 1,000 visits**, with detector completion rate as the product-quality guardrail.

Do not send file names, file paths, prompts, raw metadata, hashes, GPS, certificate serial numbers, or user file content to analytics.

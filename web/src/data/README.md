# Data Directory — JSON Schema Reference

> **Canonical data location:** `web/public/data/samples.json` and
> `web/public/data/experiments.json`. They live under `public/` so the same
> file is both imported at build time by the Astro components
> (`SampleExperience.astro`, `LatestExperiments.astro`) **and** served at
> `/data/*.json` for the runtime "load a real sample" button in `detect.js`.
> This file is documentation only — it is not imported anywhere.

All entries in these files MUST correspond to real, completed tests.
Do NOT add fabricated or estimated data.

---

## samples.json

Array of sample file records. Each entry:

```json
{
  "id": "string — unique slug, e.g. midjourney-v6-png-01",
  "title": "string — human-readable title",
  "platform": "string — e.g. Midjourney, DALL-E, Gemini",
  "fileFormat": "string — e.g. PNG, JPEG, MP4",
  "processed": "boolean — true if the file was post-processed (resaved, cropped, etc.)",
  "source": "string — brief note on where the sample came from (e.g. 'downloaded from platform')",
  "testDate": "string — ISO date YYYY-MM-DD",
  "signals": ["array of signal source strings that were found, e.g. 'C2PA', 'EXIF.Software'"],
  "knownLimits": ["array of known limitation strings for this sample"],
  "fileRef": "string — URL or relative path to the sample file (for load-and-analyze)"
}
```

## experiments.json

Array of batch experiment records. Each entry:

```json
{
  "id": "string — unique slug, e.g. midjourney-v6-batch-2026-01",
  "platform": "string — e.g. Midjourney",
  "testDate": "string — ISO date YYYY-MM-DD",
  "fileFormat": "string — e.g. PNG",
  "sampleCount": "number — how many files were tested",
  "mainFindings": "string — one-sentence summary of findings",
  "resultChanged": "boolean — true if the detection result changed from a prior experiment",
  "parserVersion": "string — engine/parser version used, e.g. 'aicheck 0.2.0 (c2pa-rs 0.82, wasm)'",
  "detailUrl": "string — URL to a blog post or report, or empty string"
}
```

---

Rule: entries must correspond to real tests actually performed.
Do not add placeholder, estimated, or fabricated rows.

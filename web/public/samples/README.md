# Sample files — sources & licenses

These files are **genuine, third-party public test assets**. They are bundled so
visitors can run the detector without uploading their own files, and every
`web/public/data/samples.json` entry was produced by running the real engine over
the file here (no hand-authored results).

| File | Origin | License |
|------|--------|---------|
| `verified-ai-credentials.jpg` | Adobe Firefly sample — [contentauth/example-assets](https://github.com/contentauth/example-assets) `images/Firefly_tabby_cat.jpg` | MIT |
| `expired-credentials.png` | OpenAI (ChatGPT) sample — [contentauth/example-assets](https://github.com/contentauth/example-assets) `images/ChatGPT_Image.png` | MIT |
| `generation-parameters.png` | ComfyUI SDXL example — [comfyanonymous/ComfyUI_examples](https://github.com/comfyanonymous/ComfyUI_examples) `sdxl/sdxl_simple_example.png` | Permissive (repo LICENSE) |
| `screenshot-no-metadata.jpg` | [contentauth/c2pa-rs](https://github.com/contentauth/c2pa-rs) `sdk/tests/fixtures/no_manifest.jpg` | Apache-2.0 / MIT |
| `plain-photo.jpg` | NASA "Blue Marble" (public domain), via c2pa-rs `sdk/tests/fixtures/earth_apollo17.jpg` | Public domain |
| `tampered-signature.jpg` | [contentauth/c2pa-rs](https://github.com/contentauth/c2pa-rs) `sdk/tests/fixtures/XCA.jpg` (deliberately tampered) | Apache-2.0 / MIT |

Files are renamed to neutral names on purpose: the detector's findings come from
the bytes inside each file, never from its filename.

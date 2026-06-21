#![cfg(target_arch = "wasm32")]

use exif::{In, Reader, Tag, Value};
use flate2::read::ZlibDecoder;
use serde::Serialize;
use std::collections::HashSet;
use std::io::{Cursor, Read};
use wasm_bindgen::prelude::*;

use crate::{
    known_tools,
    mp4_metadata_core::{self, CoreConfidence, Mp4HitKind, Mp4MetadataHit},
    web_c2pa, web_watermark,
};

const IMAGE_PLATFORMS: &[&str] = &[
    "DALL-E / OpenAI",
    "Midjourney",
    "Stable Diffusion",
    "Adobe Firefly",
    "Imagen / Google AI / Gemini",
    "Flux",
    "Ideogram",
    "Leonardo.ai",
    "NovelAI",
    "Grok",
    "Jimeng / 即梦 / Dreamina",
    "Qwen / 通义万相",
    "Bing Image Creator",
    "Copilot Designer",
    "Microsoft Designer",
    "Canva AI",
    "DreamStudio",
    "NightCafe",
    "Craiyon",
    "DeepAI",
    "Meta AI",
    "Stability AI",
    "ComfyUI",
    "Automatic1111 / A1111",
    "InvokeAI",
    "Fooocus",
    "Seedream",
    "Recraft",
];

const VIDEO_PLATFORMS: &[&str] = &[
    "Sora",
    "Google Veo",
    "Runway",
    "Pika",
    "Kling",
    "Vidu",
    "Luma",
    "Hailuo / 海螺",
    "Pixverse",
    "Genmo",
    "Haiper",
    "Wan",
];

const SUPPORTED_IMAGE_FORMATS: &[&str] = &[
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
];

const SUPPORTED_VIDEO_FORMATS: &[&str] = &[
    "video/mp4",
    "video/quicktime",
    "video/x-m4v",
    "video/webm",
    "video/x-msvideo",
];

const XMP_AI_PROPERTIES: &[&str] = &[
    "DigitalSourceType",
    "AISystemUsed",
    "AISystemVersionUsed",
    "AIPromptInformation",
    "CreatorTool",
    "Credit",
];

const AI_SOURCE_TYPES: &[(&str, &str)] = &[
    ("trainedAlgorithmicMedia", "trainedAlgorithmicMedia"),
    (
        "compositeWithTrainedAlgorithmicMedia",
        "compositeWithTrainedAlgorithmicMedia",
    ),
    ("algorithmicMedia", "algorithmicMedia"),
    ("compositeSynthetic", "compositeSynthetic"),
    ("dataDrivenMedia", "dataDrivenMedia"),
    ("trainedAlgorithmicData", "trainedAlgorithmicData"),
];

const PNG_RELEVANT_KEYWORDS: &[&str] = &[
    "Software",
    "Comment",
    "Description",
    "Source",
    "Author",
    "parameters",
    "prompt",
];

const FILENAME_PATTERNS: &[(&str, &str)] = &[
    ("dall-e", "dall-e"),
    ("dalle", "dall-e"),
    ("midjourney", "midjourney"),
    ("comfyui", "comfyui"),
    ("stability_", "stable diffusion"),
    ("novelai", "novelai"),
    ("gemini", "gemini"),
    ("imagen", "imagen"),
    ("google-ai", "google ai"),
    ("google_ai", "google ai"),
    ("dreamina", "dreamina"),
    ("jimeng", "jimeng"),
    ("qwen", "qwen"),
    ("sora", "sora"),
    ("kling", "kling"),
    ("wan", "wan"),
    ("runway", "runway"),
    ("pika", "pika"),
    ("veo", "veo"),
    ("vidu", "vidu"),
    ("luma", "luma"),
    ("hailuo", "hailuo"),
    ("pixverse", "pixverse"),
];

const EXIF_AIGC_PRODUCER_PREFIXES: &[(&str, &str)] = &[("001191110000802100433B", "qwen")];
const WEB_PARSER_VERSION: &str = concat!(env!("CARGO_PKG_VERSION"), "-wasm");

const CAMERA_TAGS: &[Tag] = &[
    Tag::Make,
    Tag::Model,
    Tag::LensModel,
    Tag::FocalLength,
    Tag::FNumber,
    Tag::ExposureTime,
    Tag::PhotographicSensitivity,
    Tag::Flash,
    Tag::MeteringMode,
    Tag::WhiteBalance,
];

#[derive(Serialize, Clone)]
struct Detail {
    key: String,
    value: String,
}

#[derive(Serialize, Clone)]
struct BrowserSignal {
    source: String,
    confidence: String,
    description: String,
    tool: Option<String>,
    details: Vec<Detail>,
}

#[derive(Serialize)]
struct BrowserReport {
    mode: String,
    file_name: Option<String>,
    mime_type: String,
    media_type: String,
    supported: bool,
    ai_generated: bool,
    overall_confidence: String,
    signals: Vec<BrowserSignal>,
    supported_platforms: Vec<String>,
    supported_formats: Vec<String>,
    supported_signal_types: Vec<String>,
    limitations: Vec<String>,
    provenance: crate::web_c2pa_verify::Provenance,
}

#[derive(Serialize)]
struct BrowserCapabilities {
    supported_platforms: Vec<String>,
    supported_formats: Vec<String>,
    supported_signal_types: Vec<String>,
    disclaimer: String,
    media_types: Vec<String>,
    limitations: Vec<String>,
}

#[derive(Serialize, Clone)]
struct InspectorField {
    group: String,
    key: String,
    value: String,
    source: String,
    sensitive: bool,
    ai_related: bool,
}

#[derive(Serialize, Clone)]
struct InspectorBlob {
    title: String,
    kind: String,
    value: String,
    sensitive: bool,
    ai_related: bool,
}

#[derive(Serialize)]
struct InspectorReport {
    tool: String,
    parser_version: String,
    mime_type: String,
    media_type: String,
    supported: bool,
    summary: Vec<String>,
    warnings: Vec<String>,
    fields: Vec<InspectorField>,
    blobs: Vec<InspectorBlob>,
    signals: Vec<BrowserSignal>,
}

struct PngTextChunk {
    chunk_type: String,
    keyword: String,
    value: String,
    compressed: bool,
    language_tag: Option<String>,
}

#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen(js_name = initPanicHook)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen(js_name = supportedImageCapabilities)]
pub fn supported_image_capabilities() -> Result<JsValue, JsValue> {
    supported_media_capabilities()
}

#[wasm_bindgen(js_name = supportedMediaCapabilities)]
pub fn supported_media_capabilities() -> Result<JsValue, JsValue> {
    let mut platforms: Vec<String> = IMAGE_PLATFORMS.iter().map(|s| s.to_string()).collect();
    platforms.extend(VIDEO_PLATFORMS.iter().map(|s| s.to_string()));
    platforms.sort();
    platforms.dedup();

    let mut formats: Vec<String> = SUPPORTED_IMAGE_FORMATS
        .iter()
        .map(|s| s.to_string())
        .collect();
    formats.extend(SUPPORTED_VIDEO_FORMATS.iter().map(|s| s.to_string()));

    let payload = BrowserCapabilities {
        supported_platforms: platforms,
        supported_formats: formats,
        supported_signal_types: supported_signal_types(),
        disclaimer: browser_disclaimer(),
        media_types: vec!["image".to_string(), "video".to_string()],
        limitations: media_limitations("media"),
    };

    serde_wasm_bindgen::to_value(&payload).map_err(js_err)
}

#[wasm_bindgen(js_name = analyzeImage)]
pub fn analyze_image(bytes: &[u8], file_name: Option<String>) -> Result<JsValue, JsValue> {
    let report = analyze_image_report(bytes, file_name)?;
    serde_wasm_bindgen::to_value(&report).map_err(js_err)
}

#[wasm_bindgen(js_name = analyzeMedia)]
pub fn analyze_media(bytes: &[u8], file_name: Option<String>) -> Result<JsValue, JsValue> {
    let report = if detect_image_mime(bytes).is_some() {
        analyze_image_report(bytes, file_name)?
    } else if let Some(mime_type) = detect_video_mime(bytes, file_name.as_deref()) {
        analyze_video_report(bytes, file_name, mime_type)
    } else {
        return Err(JsValue::from_str(
            "当前浏览器版仅支持常见图片和 MP4 / MOV / M4V / WebM / AVI 视频文件。",
        ));
    };
    serde_wasm_bindgen::to_value(&report).map_err(js_err)
}

#[wasm_bindgen(js_name = verifyC2pa)]
pub fn verify_c2pa(bytes: &[u8], mime: &str) -> Result<JsValue, JsValue> {
    let provenance = crate::web_c2pa_verify::verify_provenance(bytes, mime);
    serde_wasm_bindgen::to_value(&provenance).map_err(js_err)
}

#[wasm_bindgen(js_name = inspectExifXmp)]
pub fn inspect_exif_xmp(bytes: &[u8]) -> Result<JsValue, JsValue> {
    let report = inspect_exif_xmp_report(bytes)?;
    serde_wasm_bindgen::to_value(&report).map_err(js_err)
}

#[wasm_bindgen(js_name = inspectPngMetadata)]
pub fn inspect_png_metadata(bytes: &[u8]) -> Result<JsValue, JsValue> {
    let report = inspect_png_metadata_report(bytes)?;
    serde_wasm_bindgen::to_value(&report).map_err(js_err)
}

#[wasm_bindgen(js_name = inspectMp4Metadata)]
pub fn inspect_mp4_metadata(bytes: &[u8]) -> Result<JsValue, JsValue> {
    let report = inspect_mp4_metadata_report(bytes)?;
    serde_wasm_bindgen::to_value(&report).map_err(js_err)
}

#[wasm_bindgen(js_name = analyzeVideoFrameRgba)]
pub fn analyze_video_frame_rgba(
    rgba: &[u8],
    width: u32,
    height: u32,
    timestamp_seconds: f64,
) -> Result<JsValue, JsValue> {
    let mut signals = Vec::new();
    signals.extend(
        web_watermark::detect_invisible_rgba(rgba, width, height, Some(timestamp_seconds))
            .into_iter()
            .map(browser_signal_from_watermark),
    );
    signals.extend(
        web_watermark::detect_visible_rgba(rgba, width, height)
            .into_iter()
            .map(browser_signal_from_watermark),
    );

    dedupe_signals(&mut signals);
    signals.sort_by(|a, b| confidence_rank(&b.confidence).cmp(&confidence_rank(&a.confidence)));
    let overall_confidence = overall_confidence(&signals);

    let report = BrowserReport {
        mode: "browser-video-frame".to_string(),
        file_name: None,
        mime_type: "video/frame-rgba".to_string(),
        media_type: "video-frame".to_string(),
        supported: true,
        ai_generated: overall_confidence != "none",
        overall_confidence,
        signals,
        supported_platforms: VIDEO_PLATFORMS.iter().map(|s| s.to_string()).collect(),
        supported_formats: vec!["video/frame-rgba".to_string()],
        supported_signal_types: vec![
            "Invisible frame watermark".to_string(),
            "Visible frame watermark".to_string(),
        ],
        limitations: vec![
            "视频帧分析只检查抽样帧，不代表逐帧完整检测。".to_string(),
            "浏览器端帧分析可能受转码、缩放和抽帧质量影响。".to_string(),
        ],
        provenance: Default::default(),
    };

    serde_wasm_bindgen::to_value(&report).map_err(js_err)
}

fn analyze_image_report(bytes: &[u8], file_name: Option<String>) -> Result<BrowserReport, JsValue> {
    let Some(mime_type) = detect_image_mime(bytes) else {
        return Err(JsValue::from_str(
            "当前浏览器版仅支持 JPEG / PNG / WebP / GIF / BMP / TIFF 图片。",
        ));
    };

    let mut signals = Vec::new();
    signals.extend(detect_c2pa(bytes));
    signals.extend(detect_xmp(bytes));
    signals.extend(detect_exif(bytes));

    if mime_type == "image/png" {
        signals.extend(detect_png_text(bytes));
    }

    if let Some(name) = file_name.as_deref() {
        signals.extend(detect_filename(name));
    }

    dedupe_signals(&mut signals);
    signals.sort_by(|a, b| confidence_rank(&b.confidence).cmp(&confidence_rank(&a.confidence)));

    let overall_confidence = overall_confidence(&signals);

    Ok(BrowserReport {
        mode: "browser-image-alpha".to_string(),
        file_name,
        mime_type: mime_type.to_string(),
        media_type: "image".to_string(),
        supported: true,
        ai_generated: overall_confidence != "none",
        overall_confidence,
        signals,
        supported_platforms: IMAGE_PLATFORMS.iter().map(|s| s.to_string()).collect(),
        supported_formats: SUPPORTED_IMAGE_FORMATS
            .iter()
            .map(|s| s.to_string())
            .collect(),
        supported_signal_types: supported_signal_types(),
        limitations: media_limitations("image"),
        provenance: crate::web_c2pa_verify::verify_provenance(bytes, mime_type),
    })
}

fn analyze_video_report(
    bytes: &[u8],
    file_name: Option<String>,
    mime_type: &'static str,
) -> BrowserReport {
    let mut signals = Vec::new();
    signals.extend(detect_c2pa(bytes));
    signals.extend(detect_mp4_metadata(bytes));

    if let Some(name) = file_name.as_deref() {
        signals.extend(detect_filename(name));
    }

    dedupe_signals(&mut signals);
    signals.sort_by(|a, b| confidence_rank(&b.confidence).cmp(&confidence_rank(&a.confidence)));
    let overall_confidence = overall_confidence(&signals);

    BrowserReport {
        mode: "browser-video-alpha".to_string(),
        file_name,
        mime_type: mime_type.to_string(),
        media_type: "video".to_string(),
        supported: true,
        ai_generated: overall_confidence != "none",
        overall_confidence,
        signals,
        supported_platforms: VIDEO_PLATFORMS.iter().map(|s| s.to_string()).collect(),
        supported_formats: SUPPORTED_VIDEO_FORMATS
            .iter()
            .map(|s| s.to_string())
            .collect(),
        supported_signal_types: supported_signal_types(),
        limitations: media_limitations("video"),
        provenance: crate::web_c2pa_verify::verify_provenance(bytes, mime_type),
    }
}

fn inspect_exif_xmp_report(bytes: &[u8]) -> Result<InspectorReport, JsValue> {
    let Some(mime_type) = detect_image_mime(bytes) else {
        return Err(JsValue::from_str(
            "EXIF/XMP 阅读器当前仅支持 JPEG / PNG / WebP / GIF / BMP / TIFF 图片。",
        ));
    };

    let mut fields = vec![
        inspector_field("基础", "mime_type", mime_type, "magic-bytes"),
        inspector_field(
            "基础",
            "byte_length",
            bytes.len().to_string(),
            "browser-file",
        ),
    ];
    let mut warnings = vec![
        "元数据字段可以被编辑或删除，不能单独作为法律级证明。".to_string(),
        "复制安全摘要会跳过 GPS、序列号、作者联系方式、提示词和嵌入缩略图等敏感字段。".to_string(),
    ];
    let mut blobs = Vec::new();

    match Reader::new().read_from_container(&mut Cursor::new(bytes)) {
        Ok(exif) => {
            let mut count = 0usize;
            for field in exif.fields() {
                count += 1;
                let key = field.tag.to_string();
                let value = decode_exif_field_text(field).replace('"', "");
                let group = classify_metadata_group("EXIF", &key, &value);
                let sensitive = is_sensitive_metadata(&key, &value);
                let ai_related = is_ai_related_metadata(&key, &value);
                fields.push(InspectorField {
                    group,
                    key,
                    value: truncate(&value, 8000),
                    source: format!("EXIF::{:?}", field.ifd_num),
                    sensitive,
                    ai_related,
                });
            }
            if count == 0 {
                warnings.push("未读取到 EXIF 字段。".to_string());
            }
        }
        Err(_) => {
            warnings.push("未读取到 EXIF 字段；该格式可能不含 EXIF，或元数据已被移除。".to_string())
        }
    }

    if let Some(xml) = extract_xmp_xml_for_inspector(bytes) {
        let xmp_fields = extract_xmp_fields_for_inspector(&xml);
        if xmp_fields.is_empty() {
            warnings.push("发现 XMP 包，但未提取到简单字段；可查看原始 XMP XML。".to_string());
        }
        fields.extend(xmp_fields);
        blobs.push(InspectorBlob {
            title: "Raw XMP packet".to_string(),
            kind: "xml".to_string(),
            value: truncate(&xml, 80_000),
            sensitive: true,
            ai_related: xml.to_lowercase().contains("ai")
                || known_tools::match_ai_tool(&xml).is_some(),
        });
    } else {
        warnings.push("未发现可读 XMP packet。".to_string());
    }

    let mut signals = Vec::new();
    signals.extend(detect_xmp(bytes));
    signals.extend(detect_exif(bytes));
    dedupe_signals(&mut signals);
    let ai_field_count = fields.iter().filter(|f| f.ai_related).count();
    let sensitive_count = fields.iter().filter(|f| f.sensitive).count();
    let summary = vec![
        format!("读取到 {} 个 EXIF/XMP/基础字段。", fields.len()),
        format!("{} 个字段被标记为 AI/生成工具相关。", ai_field_count),
        format!("{} 个字段被标记为敏感，复制摘要默认跳过。", sensitive_count),
    ];

    Ok(InspectorReport {
        tool: "exif-xmp-reader".to_string(),
        parser_version: WEB_PARSER_VERSION.to_string(),
        mime_type: mime_type.to_string(),
        media_type: "image".to_string(),
        supported: true,
        summary,
        warnings,
        fields,
        blobs,
        signals,
    })
}

fn inspect_png_metadata_report(bytes: &[u8]) -> Result<InspectorReport, JsValue> {
    if bytes.len() < 8 || &bytes[..8] != b"\x89PNG\r\n\x1a\n" {
        return Err(JsValue::from_str(
            "PNG 参数提取器只支持 PNG 文件。请上传包含 tEXt / iTXt / zTXt 文本块的原始 PNG。",
        ));
    }

    let mut fields = vec![
        inspector_field("基础", "mime_type", "image/png", "magic-bytes"),
        inspector_field(
            "基础",
            "byte_length",
            bytes.len().to_string(),
            "browser-file",
        ),
    ];
    if let Some((width, height)) = png_dimensions(bytes) {
        fields.push(inspector_field("基础", "width", width.to_string(), "IHDR"));
        fields.push(inspector_field(
            "基础",
            "height",
            height.to_string(),
            "IHDR",
        ));
    }

    let (chunks, mut warnings) = parse_png_text_chunks(bytes);
    let mut blobs = Vec::new();
    let mut found_comfy = false;
    let mut found_a1111 = false;
    let mut found_novelai = false;

    for chunk in &chunks {
        let lower_key = chunk.keyword.to_lowercase();
        let lower_value = chunk.value.to_lowercase();
        let ai_related = is_png_ai_related(&chunk.keyword, &chunk.value);
        let group = if lower_key == "workflow" || lower_key == "prompt" {
            found_comfy = true;
            "ComfyUI 工作流"
        } else if lower_key == "parameters" {
            found_a1111 = true;
            "A1111 / Stable Diffusion 参数"
        } else if lower_value.contains("novelai") {
            found_novelai = true;
            "NovelAI 元数据"
        } else {
            "PNG 文本块"
        };
        let source = format!(
            "PNG::{}{}",
            chunk.chunk_type,
            if chunk.compressed { "::compressed" } else { "" }
        );
        let sensitive = is_sensitive_metadata(&chunk.keyword, &chunk.value);
        fields.push(InspectorField {
            group: group.to_string(),
            key: format!("{} ({})", chunk.keyword, chunk.chunk_type),
            value: truncate(&chunk.value, 8000),
            source: source.clone(),
            sensitive,
            ai_related,
        });
        if let Some(lang) = &chunk.language_tag {
            fields.push(inspector_field(group, "language_tag", lang, source.clone()));
        }
        append_png_parameter_fields(chunk, &mut fields);
        blobs.push(InspectorBlob {
            title: format!("{} {}", chunk.chunk_type, chunk.keyword),
            kind: if looks_like_json(&chunk.value) {
                "json".to_string()
            } else {
                "text".to_string()
            },
            value: truncate(&chunk.value, 120_000),
            sensitive,
            ai_related,
        });
    }

    if chunks.is_empty() {
        warnings.push("未发现 PNG tEXt / iTXt / zTXt 文本工作流；这不代表图片不是 AI 生成，只代表该文件没有保留可读文本参数。".to_string());
    }

    let mut signals = detect_png_text(bytes);
    dedupe_signals(&mut signals);
    let summary = vec![
        format!("发现 {} 个 PNG 文本块。", chunks.len()),
        if found_comfy {
            "发现 ComfyUI prompt/workflow 结构。".to_string()
        } else {
            "未发现 ComfyUI prompt/workflow 结构。".to_string()
        },
        if found_a1111 {
            "发现 AUTOMATIC1111 / Stable Diffusion parameters。".to_string()
        } else {
            "未发现 A1111 parameters 文本块。".to_string()
        },
        if found_novelai {
            "发现 NovelAI 相关元数据。".to_string()
        } else {
            "未发现 NovelAI 相关元数据。".to_string()
        },
    ];

    Ok(InspectorReport {
        tool: "png-parameter-extractor".to_string(),
        parser_version: WEB_PARSER_VERSION.to_string(),
        mime_type: "image/png".to_string(),
        media_type: "image".to_string(),
        supported: true,
        summary,
        warnings,
        fields,
        blobs,
        signals,
    })
}

fn inspect_mp4_metadata_report(bytes: &[u8]) -> Result<InspectorReport, JsValue> {
    let mime_type = detect_video_mime(bytes, None).unwrap_or("application/octet-stream");
    if !mp4_metadata_core::is_mp4_like(bytes) {
        return Ok(InspectorReport {
            tool: "mp4-metadata-inspector".to_string(),
            parser_version: WEB_PARSER_VERSION.to_string(),
            mime_type: mime_type.to_string(),
            media_type: "video".to_string(),
            supported: false,
            summary: vec!["未识别为 MP4/MOV/M4V 容器。".to_string()],
            warnings: vec![
                "当前专用检查器优先覆盖 MP4 / MOV / M4V 容器；WebM/AVI 可使用首页通用检测器做基础检查。".to_string(),
                "没有容器信号不代表视频不是 AI 生成。".to_string(),
            ],
            fields: vec![inspector_field("基础", "byte_length", bytes.len().to_string(), "browser-file")],
            blobs: Vec::new(),
            signals: Vec::new(),
        });
    }

    let inspection = mp4_metadata_core::inspect(bytes);
    let mut fields = vec![
        inspector_field("基础", "mime_type", mime_type, "container"),
        inspector_field(
            "基础",
            "byte_length",
            bytes.len().to_string(),
            "browser-file",
        ),
    ];
    if let Some(brand) = inspection.major_brand.as_deref() {
        fields.push(inspector_field("ftyp", "major_brand", brand, "ftyp"));
    }
    if let Some(version) = inspection.minor_version {
        fields.push(inspector_field(
            "ftyp",
            "minor_version",
            version.to_string(),
            "ftyp",
        ));
    }
    if !inspection.compatible_brands.is_empty() {
        fields.push(inspector_field(
            "ftyp",
            "compatible_brands",
            inspection.compatible_brands.join(", "),
            "ftyp",
        ));
    }
    fields.push(inspector_field(
        "C2PA / JUMBF",
        "has_c2pa_or_jumbf_text",
        inspection.has_c2pa_or_jumbf_text.to_string(),
        "container-scan",
    ));

    for (key, value) in &inspection.ilst_entries {
        let ai_related = is_ai_related_metadata(key, value);
        fields.push(InspectorField {
            group: "udta/meta/ilst".to_string(),
            key: key.clone(),
            value: truncate(value, 8000),
            source: "MP4::udta/meta/ilst".to_string(),
            sensitive: is_sensitive_metadata(key, value),
            ai_related,
        });
    }

    let signals: Vec<BrowserSignal> = inspection
        .hits
        .clone()
        .into_iter()
        .map(browser_signal_from_mp4_hit)
        .collect();

    let mut box_tree = String::new();
    for item in &inspection.boxes {
        box_tree.push_str(&format!("{} @{} +{}\n", item.path, item.offset, item.size));
    }

    let mut warnings = vec![
        "容器检查不会一开始加载 ffmpeg.wasm；抽样帧水印仍由首页通用检测器按需执行。".to_string(),
        "未发现平台字段不代表视频不是 AI 生成，转码和剪辑导出常会移除来源字段。".to_string(),
    ];
    if inspection.boxes.len() >= 240 {
        warnings.push("box 树输出已截断到前 240 个节点，避免大文件阻塞页面。".to_string());
    }
    let summary = vec![
        format!("识别到 {} 个 MP4/MOV box 节点。", inspection.boxes.len()),
        format!(
            "读取到 {} 个 ilst 元数据字段。",
            inspection.ilst_entries.len()
        ),
        format!("发现 {} 条 AI 视频相关容器信号。", signals.len()),
    ];

    Ok(InspectorReport {
        tool: "mp4-metadata-inspector".to_string(),
        parser_version: WEB_PARSER_VERSION.to_string(),
        mime_type: mime_type.to_string(),
        media_type: "video".to_string(),
        supported: true,
        summary,
        warnings,
        fields,
        blobs: vec![InspectorBlob {
            title: "MP4/MOV box tree".to_string(),
            kind: "tree".to_string(),
            value: box_tree,
            sensitive: false,
            ai_related: false,
        }],
        signals,
    })
}

fn browser_disclaimer() -> String {
    "当前浏览器版检测图片和视频里的 C2PA Content Credentials / EXIF / XMP / PNG 文本块 / MP4 元数据 / 文件名 / 抽样视频帧水印等来源信号。它不是万能 AI 鉴定器，只能覆盖已知、且仍然保留在文件中的平台痕迹。".to_string()
}

fn supported_signal_types() -> Vec<String> {
    vec![
        "C2PA Content Credentials / JUMBF".to_string(),
        "EXIF metadata".to_string(),
        "XMP / IPTC metadata".to_string(),
        "PNG tEXt / iTXt chunks".to_string(),
        "MP4 container metadata / AIGC labels / SEI markers".to_string(),
        "Sampled video frame watermark analysis".to_string(),
        "Filename heuristics".to_string(),
    ]
}

fn media_limitations(media_type: &str) -> Vec<String> {
    let mut limitations = vec![
        "这不是万能 AI 鉴定器，只基于元数据、水印和启发式信号判断。".to_string(),
        "如果文件经过平台压缩、截图、转存、转码或清洗元数据，很多信号会消失。".to_string(),
        "浏览器版会读取 C2PA Content Credentials / JUMBF 中的来源文本，但不做完整签名和证书链验证。".to_string(),
        "未检测到 AI 信号，不等于文件一定不是 AI 生成。".to_string(),
        "当前仅支持检测上方列出的平台/工具相关来源信号，不应外推到所有生成模型。".to_string(),
    ];
    if media_type == "video" || media_type == "media" {
        limitations.push(
            "视频帧分析会抽样少量帧，结果可能受浏览器内转码、抽帧和文件大小影响。".to_string(),
        );
    }
    limitations
}

fn js_err<E: ToString>(error: E) -> JsValue {
    JsValue::from_str(&error.to_string())
}

fn confidence_rank(confidence: &str) -> usize {
    match confidence {
        "high" => 3,
        "medium" => 2,
        "low" => 1,
        _ => 0,
    }
}

fn overall_confidence(signals: &[BrowserSignal]) -> String {
    signals
        .iter()
        .map(|signal| signal.confidence.clone())
        .max_by_key(|confidence| confidence_rank(confidence))
        .unwrap_or_else(|| "none".to_string())
}

fn dedupe_signals(signals: &mut Vec<BrowserSignal>) {
    let mut seen = HashSet::new();
    signals.retain(|signal| {
        let key = format!(
            "{}|{}|{}|{}",
            signal.source,
            signal.confidence,
            signal.description,
            signal.tool.clone().unwrap_or_default()
        );
        seen.insert(key)
    });
}

fn detect_image_mime(bytes: &[u8]) -> Option<&'static str> {
    if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        Some("image/jpeg")
    } else if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        Some("image/png")
    } else if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
        Some("image/gif")
    } else if bytes.starts_with(b"BM") {
        Some("image/bmp")
    } else if bytes.len() >= 12 && &bytes[..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        Some("image/webp")
    } else if bytes.starts_with(&[0x49, 0x49, 0x2A, 0x00])
        || bytes.starts_with(&[0x4D, 0x4D, 0x00, 0x2A])
    {
        Some("image/tiff")
    } else {
        None
    }
}

fn detect_video_mime(bytes: &[u8], file_name: Option<&str>) -> Option<&'static str> {
    let lower_name = file_name.unwrap_or_default().to_lowercase();
    if mp4_metadata_core::is_mp4_like(bytes) {
        if lower_name.ends_with(".mov") {
            Some("video/quicktime")
        } else if lower_name.ends_with(".m4v") {
            Some("video/x-m4v")
        } else {
            Some("video/mp4")
        }
    } else if bytes.starts_with(&[0x1A, 0x45, 0xDF, 0xA3]) || lower_name.ends_with(".webm") {
        Some("video/webm")
    } else if bytes.starts_with(b"RIFF") && bytes.len() >= 12 && &bytes[8..12] == b"AVI " {
        Some("video/x-msvideo")
    } else if lower_name.ends_with(".mp4") {
        Some("video/mp4")
    } else if lower_name.ends_with(".mov") {
        Some("video/quicktime")
    } else if lower_name.ends_with(".m4v") {
        Some("video/x-m4v")
    } else if lower_name.ends_with(".avi") {
        Some("video/x-msvideo")
    } else {
        None
    }
}

fn inspector_field(
    group: impl Into<String>,
    key: impl Into<String>,
    value: impl Into<String>,
    source: impl Into<String>,
) -> InspectorField {
    let key = key.into();
    let value = value.into();
    InspectorField {
        group: group.into(),
        sensitive: is_sensitive_metadata(&key, &value),
        ai_related: is_ai_related_metadata(&key, &value),
        key,
        value,
        source: source.into(),
    }
}

fn classify_metadata_group(source: &str, key: &str, value: &str) -> String {
    let lower_key = key.to_lowercase();
    let lower_value = value.to_lowercase();
    if is_ai_related_metadata(key, value) {
        "AI / 生成工具".to_string()
    } else if lower_key.contains("gps") || lower_key.contains("location") {
        "位置".to_string()
    } else if lower_key.contains("software")
        || lower_key.contains("creator")
        || lower_key.contains("tool")
        || lower_key.contains("producer")
    {
        "软件".to_string()
    } else if lower_key.contains("date")
        || lower_key.contains("time")
        || lower_value.contains("utc")
    {
        "时间".to_string()
    } else if lower_key.contains("copyright")
        || lower_key.contains("rights")
        || lower_key.contains("artist")
        || lower_key.contains("author")
        || lower_key.contains("credit")
    {
        "版权 / 作者".to_string()
    } else if lower_key.contains("make")
        || lower_key.contains("model")
        || lower_key.contains("lens")
        || lower_key.contains("fnumber")
        || lower_key.contains("focallength")
        || lower_key.contains("exposure")
        || lower_key.contains("iso")
    {
        "相机".to_string()
    } else {
        source.to_string()
    }
}

fn is_sensitive_metadata(key: &str, value: &str) -> bool {
    let combined = format!("{} {}", key, value).to_lowercase();
    [
        "gps",
        "location",
        "latitude",
        "longitude",
        "serial",
        "owner",
        "artist",
        "author",
        "creator",
        "email",
        "phone",
        "address",
        "contact",
        "thumbnail",
        "usercomment",
        "prompt",
        "workflow",
        "parameters",
        "negative prompt",
    ]
    .iter()
    .any(|needle| combined.contains(needle))
}

fn is_ai_related_metadata(key: &str, value: &str) -> bool {
    let combined = format!("{} {}", key, value);
    let lower = combined.to_lowercase();
    lower.contains("aigc")
        || lower.contains("ai")
        || lower.contains("digital source")
        || lower.contains("trainedalgorithmic")
        || lower.contains("algorithmicmedia")
        || lower.contains("prompt")
        || lower.contains("workflow")
        || lower.contains("model")
        || known_tools::match_ai_tool(&combined).is_some()
}

fn detail(key: impl Into<String>, value: impl Into<String>) -> (String, String) {
    (key.into(), value.into())
}

fn make_signal(
    source: &str,
    confidence: &str,
    description: impl Into<String>,
    tool: Option<String>,
    details: Vec<(String, String)>,
) -> BrowserSignal {
    BrowserSignal {
        source: source.to_string(),
        confidence: confidence.to_string(),
        description: description.into(),
        tool,
        details: details
            .into_iter()
            .map(|(key, value)| Detail {
                key: key.into(),
                value: value.into(),
            })
            .collect(),
    }
}

fn detect_filename(file_name: &str) -> Vec<BrowserSignal> {
    let lower = file_name.to_lowercase();
    for &(pattern, tool_name) in FILENAME_PATTERNS {
        if lower.contains(pattern) {
            return vec![make_signal(
                "FILE",
                "low",
                format!("文件名命中已知 AI 工具模式：{pattern}"),
                Some(tool_name.to_string()),
                vec![detail("filename", file_name.to_string())],
            )];
        }
    }
    Vec::new()
}

fn detect_c2pa(bytes: &[u8]) -> Vec<BrowserSignal> {
    web_c2pa::detect(bytes)
        .into_iter()
        .map(|signal| BrowserSignal {
            source: signal.source.to_string(),
            confidence: signal.confidence.to_string(),
            description: signal.description,
            tool: signal.tool,
            details: signal
                .details
                .into_iter()
                .map(|(key, value)| Detail { key, value })
                .collect(),
        })
        .collect()
}

fn detect_mp4_metadata(bytes: &[u8]) -> Vec<BrowserSignal> {
    mp4_metadata_core::detect(bytes)
        .into_iter()
        .map(browser_signal_from_mp4_hit)
        .collect()
}

fn browser_signal_from_mp4_hit(hit: Mp4MetadataHit) -> BrowserSignal {
    let confidence = match hit.confidence {
        CoreConfidence::Low => "low",
        CoreConfidence::Medium => "medium",
        CoreConfidence::High => "high",
    };
    let description = match &hit.kind {
        Mp4HitKind::ToolMatch { label, value } => {
            format!("MP4 {label} 命中已知 AI 视频工具：{value}")
        }
        Mp4HitKind::AigcLabel {
            produce_id: Some(id),
        } => format!("MP4 AIGC 标签标记为 AI 生成，ProduceID：{id}"),
        Mp4HitKind::AigcLabel { produce_id: None } => "MP4 AIGC 标签标记为 AI 生成。".to_string(),
        Mp4HitKind::SeiMarker { marker } => {
            format!("MP4 SEI marker 命中已知 AI 视频工具：{marker}")
        }
    };
    BrowserSignal {
        source: "MP4".to_string(),
        confidence: confidence.to_string(),
        description,
        tool: hit.tool,
        details: hit
            .details
            .into_iter()
            .map(|(key, value)| Detail { key, value })
            .collect(),
    }
}

fn browser_signal_from_watermark(signal: web_watermark::WebWatermarkSignal) -> BrowserSignal {
    BrowserSignal {
        source: signal.source.to_string(),
        confidence: signal.confidence.to_string(),
        description: signal.description,
        tool: None,
        details: signal
            .details
            .into_iter()
            .map(|(key, value)| Detail { key, value })
            .collect(),
    }
}

fn detect_xmp(bytes: &[u8]) -> Vec<BrowserSignal> {
    let search_data = if bytes.len() > 10 * 1_048_576 {
        &bytes[..10 * 1_048_576]
    } else {
        bytes
    };

    let Some(xml) = extract_xmp_xml(search_data) else {
        return Vec::new();
    };

    let mut signals = Vec::new();

    if let Some(value) = extract_xmp_property(&xml, "DigitalSourceType") {
        for (name, pattern) in AI_SOURCE_TYPES {
            if value.contains(pattern) {
                signals.push(make_signal(
                    "XMP",
                    "medium",
                    format!("XMP DigitalSourceType 指向 AI 来源：{name}"),
                    None,
                    vec![detail("DigitalSourceType", value.clone())],
                ));
                break;
            }
        }
    }

    if let Some(value) = extract_xmp_property(&xml, "AISystemUsed") {
        let tool = known_tools::match_ai_tool(&value).map(|s| s.to_string());
        signals.push(make_signal(
            "XMP",
            "medium",
            format!("XMP AISystemUsed 记录了生成系统：{value}"),
            tool,
            vec![detail("AISystemUsed", value)],
        ));
    }

    if let Some(value) = extract_xmp_property(&xml, "AIPromptInformation") {
        signals.push(make_signal(
            "XMP",
            "medium",
            "XMP 中发现 AIPromptInformation。".to_string(),
            None,
            vec![detail("AIPromptInformation", truncate(&value, 240))],
        ));
    }

    if let Some(value) = extract_xmp_property(&xml, "CreatorTool") {
        if let Some(tool_name) = known_tools::match_ai_tool(&value) {
            signals.push(make_signal(
                "XMP",
                "medium",
                format!("XMP CreatorTool 命中已知 AI 工具：{value}"),
                Some(tool_name.to_string()),
                vec![detail("CreatorTool", value)],
            ));
        }
    }

    if let Some(value) = extract_xmp_property(&xml, "Credit") {
        if let Some(tool_name) = known_tools::match_ai_tool(&value) {
            signals.push(make_signal(
                "XMP",
                "medium",
                format!("XMP Credit 命中已知 AI 平台：{value}"),
                Some(tool_name.to_string()),
                vec![detail("Credit", value)],
            ));
        }
    }

    signals
}

fn detect_exif(bytes: &[u8]) -> Vec<BrowserSignal> {
    let mut cursor = Cursor::new(bytes);
    let exif = match Reader::new().read_from_container(&mut cursor) {
        Ok(exif) => exif,
        Err(_) => return Vec::new(),
    };

    let mut signals = Vec::new();
    let mut software_matched = false;

    if let Some(field) = exif.get_field(Tag::Software, In::PRIMARY) {
        let value = field.display_value().to_string().replace('"', "");
        if let Some(tool_name) = known_tools::match_ai_tool(&value) {
            signals.push(make_signal(
                "EXIF",
                "low",
                format!("EXIF Software 命中已知 AI 工具：{value}"),
                Some(tool_name.to_string()),
                vec![detail("Software", value)],
            ));
            software_matched = true;
        }
    }

    for tag in [Tag::Make, Tag::Model] {
        if let Some(field) = exif.get_field(tag, In::PRIMARY) {
            let value = field.display_value().to_string().replace('"', "");
            if let Some(tool_name) = known_tools::match_ai_tool(&value) {
                signals.push(make_signal(
                    "EXIF",
                    "low",
                    format!("EXIF {} 字段命中 AI 工具：{value}", tag),
                    Some(tool_name.to_string()),
                    vec![detail(tag.to_string(), value)],
                ));
                software_matched = true;
            }
        }
    }

    for tag in [Tag::ImageDescription, Tag::UserComment] {
        if let Some(field) = exif.get_field(tag, In::PRIMARY) {
            let raw_val = decode_exif_field_text(field);
            let value = raw_val.replace('"', "");
            if let Some(tool_name) = known_tools::match_ai_tool(&value) {
                signals.push(make_signal(
                    "EXIF",
                    "low",
                    format!("EXIF {} 字段引用了 AI 工具。", tag),
                    Some(tool_name.to_string()),
                    vec![detail(tag.to_string(), truncate(&value, 240))],
                ));
                software_matched = true;
            } else if raw_val.contains("\"AIGC\"")
                && (raw_val.contains("\"Label\":\"1\"") || raw_val.contains("\"Label\": \"1\""))
            {
                let tool = extract_json_field(&raw_val, "ContentProducer").and_then(|content| {
                    EXIF_AIGC_PRODUCER_PREFIXES
                        .iter()
                        .find(|(prefix, _)| content.starts_with(prefix))
                        .map(|(_, tool)| tool.to_string())
                });
                signals.push(make_signal(
                    "EXIF",
                    "medium",
                    "EXIF UserComment 中发现 AIGC 标签。".to_string(),
                    tool,
                    vec![detail(tag.to_string(), truncate(&value, 240))],
                ));
                software_matched = true;
            }
        }
    }

    if let Some(field) = exif.get_field(Tag::Artist, In::PRIMARY) {
        let value = field.display_value().to_string().replace('"', "");
        let is_hex_hash =
            value.len() >= 32 && value.chars().all(|c| c.is_ascii_hexdigit() || c == '-');
        if is_hex_hash {
            signals.push(make_signal(
                "EXIF",
                "low",
                "EXIF Artist 字段看起来像生成链路留下的哈希值。".to_string(),
                None,
                vec![detail("Artist", value)],
            ));
            software_matched = true;
        }
    }

    if software_matched {
        let camera_tag_count = CAMERA_TAGS
            .iter()
            .filter(|&&tag| exif.get_field(tag, In::PRIMARY).is_some())
            .count();
        if camera_tag_count == 0 {
            signals.push(make_signal(
                "EXIF",
                "low",
                "EXIF 中缺少典型相机字段，和 AI 输出更一致。".to_string(),
                None,
                vec![detail("camera_tags_present", "0")],
            ));
        }
    }

    signals
}

fn detect_png_text(bytes: &[u8]) -> Vec<BrowserSignal> {
    if bytes.len() < 8 || &bytes[..8] != b"\x89PNG\r\n\x1a\n" {
        return Vec::new();
    }

    let mut signals = Vec::new();
    let (chunks, _) = parse_png_text_chunks(bytes);
    for chunk in chunks {
        append_png_text_signal(&chunk.keyword, &chunk.value, &mut signals);
    }

    signals
}

fn append_png_text_signal(keyword: &str, value: &str, signals: &mut Vec<BrowserSignal>) {
    let keyword_lower = keyword.to_lowercase();
    let is_relevant = PNG_RELEVANT_KEYWORDS
        .iter()
        .any(|entry| keyword_lower == entry.to_lowercase());
    if !is_relevant {
        return;
    }

    if let Some(tool_name) = known_tools::match_ai_tool(value) {
        signals.push(make_signal(
            "PNG",
            "low",
            format!("PNG 文本块 {keyword} 命中 AI 工具。"),
            Some(tool_name.to_string()),
            vec![detail(keyword.to_string(), truncate(value, 240))],
        ));
    }
}

fn png_dimensions(bytes: &[u8]) -> Option<(u32, u32)> {
    if bytes.len() < 24 || &bytes[..8] != b"\x89PNG\r\n\x1a\n" || &bytes[12..16] != b"IHDR" {
        return None;
    }
    let width = u32::from_be_bytes([bytes[16], bytes[17], bytes[18], bytes[19]]);
    let height = u32::from_be_bytes([bytes[20], bytes[21], bytes[22], bytes[23]]);
    Some((width, height))
}

fn parse_png_text_chunks(bytes: &[u8]) -> (Vec<PngTextChunk>, Vec<String>) {
    let mut chunks = Vec::new();
    let mut warnings = Vec::new();
    let mut pos = 8usize;

    while pos + 12 <= bytes.len() {
        let length =
            u32::from_be_bytes([bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]])
                as usize;
        let chunk_type = &bytes[pos + 4..pos + 8];
        let chunk_data_end = pos + 8 + length;
        if chunk_data_end > bytes.len() {
            warnings.push("PNG chunk length 超出文件边界，后续文本块可能被截断。".to_string());
            break;
        }
        let chunk_data = &bytes[pos + 8..chunk_data_end];

        match chunk_type {
            b"tEXt" => parse_png_text_chunk(chunk_data, "tEXt", false, &mut chunks, &mut warnings),
            b"zTXt" => parse_png_ztxt_chunk(chunk_data, &mut chunks, &mut warnings),
            b"iTXt" => parse_png_itxt_chunk(chunk_data, &mut chunks, &mut warnings),
            b"IEND" => break,
            _ => {}
        }

        pos = chunk_data_end + 4;
    }

    (chunks, warnings)
}

fn parse_png_text_chunk(
    chunk_data: &[u8],
    chunk_type: &str,
    compressed: bool,
    chunks: &mut Vec<PngTextChunk>,
    warnings: &mut Vec<String>,
) {
    let Some(null_pos) = chunk_data.iter().position(|&b| b == 0) else {
        warnings.push(format!("{chunk_type} 文本块缺少 keyword 分隔符。"));
        return;
    };
    let Ok(keyword) = std::str::from_utf8(&chunk_data[..null_pos]) else {
        warnings.push(format!("{chunk_type} keyword 不是 UTF-8。"));
        return;
    };
    let Ok(value) = std::str::from_utf8(&chunk_data[null_pos + 1..]) else {
        warnings.push(format!("{chunk_type} value 不是 UTF-8。"));
        return;
    };
    chunks.push(PngTextChunk {
        chunk_type: chunk_type.to_string(),
        keyword: keyword.to_string(),
        value: value.to_string(),
        compressed,
        language_tag: None,
    });
}

fn parse_png_ztxt_chunk(
    chunk_data: &[u8],
    chunks: &mut Vec<PngTextChunk>,
    warnings: &mut Vec<String>,
) {
    let Some(null_pos) = chunk_data.iter().position(|&b| b == 0) else {
        warnings.push("zTXt 文本块缺少 keyword 分隔符。".to_string());
        return;
    };
    let Ok(keyword) = std::str::from_utf8(&chunk_data[..null_pos]) else {
        warnings.push("zTXt keyword 不是 UTF-8。".to_string());
        return;
    };
    if null_pos + 2 > chunk_data.len() {
        warnings.push(format!("zTXt {keyword} 缺少压缩方法字段。"));
        return;
    }
    let compression_method = chunk_data[null_pos + 1];
    if compression_method != 0 {
        warnings.push(format!(
            "zTXt {keyword} 使用未知压缩方法 {compression_method}。"
        ));
        return;
    }
    match inflate_zlib_text(&chunk_data[null_pos + 2..]) {
        Ok(value) => chunks.push(PngTextChunk {
            chunk_type: "zTXt".to_string(),
            keyword: keyword.to_string(),
            value,
            compressed: true,
            language_tag: None,
        }),
        Err(err) => warnings.push(format!("zTXt {keyword} 解压失败：{err}")),
    }
}

fn parse_png_itxt_chunk(
    chunk_data: &[u8],
    chunks: &mut Vec<PngTextChunk>,
    warnings: &mut Vec<String>,
) {
    let Some(keyword_end) = chunk_data.iter().position(|&b| b == 0) else {
        warnings.push("iTXt 文本块缺少 keyword 分隔符。".to_string());
        return;
    };
    let Ok(keyword) = std::str::from_utf8(&chunk_data[..keyword_end]) else {
        warnings.push("iTXt keyword 不是 UTF-8。".to_string());
        return;
    };
    if keyword_end + 3 > chunk_data.len() {
        warnings.push(format!("iTXt {keyword} 缺少压缩标记。"));
        return;
    }
    let compressed = chunk_data[keyword_end + 1] == 1;
    let compression_method = chunk_data[keyword_end + 2];
    let mut cursor = keyword_end + 3;
    let Some(lang_end_rel) = chunk_data[cursor..].iter().position(|&b| b == 0) else {
        warnings.push(format!("iTXt {keyword} 缺少 language tag。"));
        return;
    };
    let lang_end = cursor + lang_end_rel;
    let language_tag = std::str::from_utf8(&chunk_data[cursor..lang_end])
        .ok()
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());
    cursor = lang_end + 1;
    let Some(translated_end_rel) = chunk_data[cursor..].iter().position(|&b| b == 0) else {
        warnings.push(format!("iTXt {keyword} 缺少 translated keyword。"));
        return;
    };
    cursor += translated_end_rel + 1;
    let text_bytes = &chunk_data[cursor..];
    let value = if compressed {
        if compression_method != 0 {
            warnings.push(format!(
                "iTXt {keyword} 使用未知压缩方法 {compression_method}。"
            ));
            return;
        }
        match inflate_zlib_text(text_bytes) {
            Ok(value) => value,
            Err(err) => {
                warnings.push(format!("iTXt {keyword} 解压失败：{err}"));
                return;
            }
        }
    } else {
        match std::str::from_utf8(text_bytes) {
            Ok(value) => value.to_string(),
            Err(_) => {
                warnings.push(format!("iTXt {keyword} 文本不是 UTF-8。"));
                return;
            }
        }
    };
    chunks.push(PngTextChunk {
        chunk_type: "iTXt".to_string(),
        keyword: keyword.to_string(),
        value,
        compressed,
        language_tag,
    });
}

fn inflate_zlib_text(data: &[u8]) -> Result<String, String> {
    let mut decoder = ZlibDecoder::new(data);
    let mut out = String::new();
    decoder
        .read_to_string(&mut out)
        .map_err(|err| err.to_string())?;
    Ok(out)
}

fn is_png_ai_related(keyword: &str, value: &str) -> bool {
    let lower_key = keyword.to_lowercase();
    lower_key == "parameters"
        || lower_key == "prompt"
        || lower_key == "workflow"
        || lower_key == "comment"
        || is_ai_related_metadata(keyword, value)
}

fn looks_like_json(value: &str) -> bool {
    let trimmed = value.trim_start();
    trimmed.starts_with('{') || trimmed.starts_with('[')
}

fn append_png_parameter_fields(chunk: &PngTextChunk, fields: &mut Vec<InspectorField>) {
    let lower_key = chunk.keyword.to_lowercase();
    if lower_key == "parameters" {
        append_a1111_parameter_fields(&chunk.value, fields);
    } else if lower_key == "workflow" || lower_key == "prompt" {
        let node_count = chunk.value.matches("\"class_type\"").count();
        if node_count > 0 {
            fields.push(InspectorField {
                group: "ComfyUI 工作流".to_string(),
                key: "node_count".to_string(),
                value: node_count.to_string(),
                source: format!("PNG::{}", chunk.keyword),
                sensitive: false,
                ai_related: true,
            });
        }
        if let Some(first_node) = extract_json_field(&chunk.value, "class_type") {
            fields.push(InspectorField {
                group: "ComfyUI 工作流".to_string(),
                key: "first_class_type".to_string(),
                value: first_node,
                source: format!("PNG::{}", chunk.keyword),
                sensitive: false,
                ai_related: true,
            });
        }
    } else if chunk.value.to_lowercase().contains("novelai") {
        fields.push(InspectorField {
            group: "NovelAI 元数据".to_string(),
            key: "platform_hint".to_string(),
            value: "NovelAI".to_string(),
            source: format!("PNG::{}", chunk.keyword),
            sensitive: false,
            ai_related: true,
        });
    }
}

fn append_a1111_parameter_fields(value: &str, fields: &mut Vec<InspectorField>) {
    let source = "PNG::parameters";
    let (prompt, rest) = if let Some(pos) = value.find("Negative prompt:") {
        (&value[..pos], &value[pos + "Negative prompt:".len()..])
    } else {
        (value, "")
    };
    let prompt = prompt.trim();
    if !prompt.is_empty() {
        fields.push(InspectorField {
            group: "A1111 / Stable Diffusion 参数".to_string(),
            key: "positive_prompt".to_string(),
            value: truncate(prompt, 8000),
            source: source.to_string(),
            sensitive: true,
            ai_related: true,
        });
    }
    let (negative_prompt, param_text) = if let Some(pos) = rest.find("\nSteps:") {
        (&rest[..pos], &rest[pos + 1..])
    } else if rest.trim_start().starts_with("Steps:") {
        ("", rest.trim_start())
    } else {
        ("", rest)
    };
    if !negative_prompt.trim().is_empty() {
        fields.push(InspectorField {
            group: "A1111 / Stable Diffusion 参数".to_string(),
            key: "negative_prompt".to_string(),
            value: truncate(negative_prompt.trim(), 8000),
            source: source.to_string(),
            sensitive: true,
            ai_related: true,
        });
    }
    for part in param_text.split(',') {
        let Some((key, val)) = part.split_once(':') else {
            continue;
        };
        let key = key.trim();
        let val = val.trim();
        if key.is_empty() || val.is_empty() {
            continue;
        }
        let wanted = [
            "Steps",
            "Sampler",
            "Schedule type",
            "CFG scale",
            "Seed",
            "Size",
            "Model hash",
            "Model",
            "Denoising strength",
            "Clip skip",
        ]
        .iter()
        .any(|candidate| key.eq_ignore_ascii_case(candidate));
        if wanted {
            fields.push(InspectorField {
                group: "A1111 / Stable Diffusion 参数".to_string(),
                key: key.to_string(),
                value: val.to_string(),
                source: source.to_string(),
                sensitive: false,
                ai_related: true,
            });
        }
    }
}

fn extract_xmp_xml(data: &[u8]) -> Option<String> {
    let patterns = [
        (b"<x:xmpmeta".as_slice(), b"</x:xmpmeta>".as_slice()),
        (b"<xmpmeta".as_slice(), b"</xmpmeta>".as_slice()),
        (b"<rdf:RDF".as_slice(), b"</rdf:RDF>".as_slice()),
    ];

    for (begin, end) in patterns {
        if let Some(start) = find_subsequence(data, begin) {
            if let Some(relative_end) = find_subsequence(&data[start..], end) {
                let xml_end = start + relative_end + end.len();
                if let Ok(xml) = std::str::from_utf8(&data[start..xml_end]) {
                    return Some(xml.to_string());
                }
            }
        }
    }

    None
}

fn extract_xmp_xml_for_inspector(data: &[u8]) -> Option<String> {
    let search_data = if data.len() > 20 * 1_048_576 {
        &data[..20 * 1_048_576]
    } else {
        data
    };
    extract_xmp_xml(search_data)
}

fn extract_xmp_fields_for_inspector(xml: &str) -> Vec<InspectorField> {
    let mut fields = Vec::new();
    let mut seen = HashSet::new();

    for prop_name in XMP_AI_PROPERTIES {
        if let Some(value) = extract_xmp_property(xml, prop_name) {
            push_xmp_field(prop_name, &value, &mut seen, &mut fields);
        }
    }

    for tag in xml.split('<').skip(1) {
        let Some(tag_end) = tag.find('>') else {
            continue;
        };
        let tag_head = &tag[..tag_end];
        if tag_head.starts_with('/')
            || tag_head.starts_with('?')
            || tag_head.starts_with('!')
            || tag_head.starts_with("x:xmpmeta")
            || tag_head.starts_with("rdf:RDF")
        {
            continue;
        }
        for (key, value) in extract_xml_attributes(tag_head) {
            if key.starts_with("xmlns") || value.is_empty() {
                continue;
            }
            push_xmp_field(&key, &value, &mut seen, &mut fields);
            if fields.len() >= 220 {
                return fields;
            }
        }
    }

    for prop_name in [
        "CreateDate",
        "ModifyDate",
        "MetadataDate",
        "CreatorTool",
        "Producer",
        "Software",
        "Description",
        "title",
        "creator",
        "rights",
        "DigitalSourceType",
        "AIPromptInformation",
        "AISystemUsed",
    ] {
        if let Some(value) = extract_xmp_property(xml, prop_name) {
            push_xmp_field(prop_name, &value, &mut seen, &mut fields);
        }
    }

    fields
}

fn extract_xml_attributes(tag_head: &str) -> Vec<(String, String)> {
    let mut attrs = Vec::new();
    let bytes = tag_head.as_bytes();
    let mut pos = 0usize;
    while pos < bytes.len() {
        let Some(eq_rel) = tag_head[pos..].find('=') else {
            break;
        };
        let eq = pos + eq_rel;
        let key_start = tag_head[..eq]
            .rfind(|c: char| c.is_whitespace() || c == '<')
            .map(|idx| idx + 1)
            .unwrap_or(0);
        let key = tag_head[key_start..eq].trim();
        let quote_pos = eq + 1;
        if quote_pos >= bytes.len() {
            break;
        }
        let quote = bytes[quote_pos];
        if quote != b'"' && quote != b'\'' {
            pos = eq + 1;
            continue;
        }
        let value_start = quote_pos + 1;
        let Some(value_end_rel) = bytes[value_start..].iter().position(|&b| b == quote) else {
            break;
        };
        let value_end = value_start + value_end_rel;
        if !key.is_empty() {
            attrs.push((
                key.to_string(),
                tag_head[value_start..value_end].to_string(),
            ));
        }
        pos = value_end + 1;
    }
    attrs
}

fn push_xmp_field(
    key: &str,
    value: &str,
    seen: &mut HashSet<String>,
    fields: &mut Vec<InspectorField>,
) {
    let value = normalize_xml_text(value);
    if value.trim().is_empty() {
        return;
    }
    let dedupe_key = format!("{key}\0{value}");
    if !seen.insert(dedupe_key) {
        return;
    }
    let group = classify_metadata_group("XMP", key, &value);
    let sensitive = is_sensitive_metadata(key, &value);
    let ai_related = is_ai_related_metadata(key, &value);
    fields.push(InspectorField {
        group,
        key: key.to_string(),
        value: truncate(&value, 8000),
        source: "XMP".to_string(),
        sensitive,
        ai_related,
    });
}

fn normalize_xml_text(value: &str) -> String {
    value
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .trim()
        .to_string()
}

fn extract_xmp_property(xml: &str, prop_name: &str) -> Option<String> {
    for prefix in ["Iptc4xmpExt:", "xmp:", "dc:", "photoshop:", ""] {
        let open_tag = format!("<{}{}", prefix, prop_name);
        if let Some(start) = xml.find(&open_tag) {
            let after_tag = &xml[start + open_tag.len()..];
            if let Some(gt_pos) = after_tag.find('>') {
                let content_start = gt_pos + 1;
                let close_tag = format!("</{}{}>", prefix, prop_name);
                if let Some(end_pos) = after_tag.find(&close_tag) {
                    if end_pos > content_start {
                        let value = after_tag[content_start..end_pos].trim();
                        if !value.is_empty() {
                            return Some(value.to_string());
                        }
                    }
                }
            }
        }
    }

    for prefix in ["Iptc4xmpExt:", "xmp:", "dc:", "photoshop:", ""] {
        let attr = format!("{}{}=\"", prefix, prop_name);
        if let Some(start) = xml.find(&attr) {
            let value_start = start + attr.len();
            if let Some(end) = xml[value_start..].find('"') {
                let value = &xml[value_start..value_start + end];
                if !value.is_empty() {
                    return Some(value.to_string());
                }
            }
        }
    }

    None
}

fn decode_exif_field_text(field: &exif::Field) -> String {
    if let Value::Undefined(ref bytes, _) = field.value {
        if bytes.len() > 8 {
            if let Ok(text) = std::str::from_utf8(&bytes[8..]) {
                return text.trim_end_matches('\0').to_string();
            }
        }
    }
    field.display_value().to_string()
}

fn extract_json_field(json: &str, field: &str) -> Option<String> {
    let pattern = format!("\"{}\"", field);
    let idx = json.find(&pattern)?;
    let after = &json[idx + pattern.len()..];
    let after = after.trim_start();
    let after = after.strip_prefix(':')?;
    let after = after.trim_start();
    let after = after.strip_prefix('"')?;
    let end = after.find('"')?;
    Some(after[..end].to_string())
}

fn find_subsequence(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}

fn truncate(text: &str, max: usize) -> String {
    let mut chars = text.chars();
    let truncated: String = chars.by_ref().take(max).collect();
    if chars.next().is_none() {
        text.to_string()
    } else {
        format!("{}...", truncated)
    }
}

#[allow(dead_code)]
fn dump_known_xmp_properties(bytes: &[u8]) -> Vec<(String, String)> {
    let search_data = if bytes.len() > 10 * 1_048_576 {
        &bytes[..10 * 1_048_576]
    } else {
        bytes
    };

    let Some(xml) = extract_xmp_xml(search_data) else {
        return Vec::new();
    };

    let mut properties = Vec::new();
    for prop_name in XMP_AI_PROPERTIES {
        if let Some(value) = extract_xmp_property(&xml, prop_name) {
            properties.push((prop_name.to_string(), value));
        }
    }
    properties
}

#![cfg(target_arch = "wasm32")]

use exif::{In, Reader, Tag, Value};
use serde::Serialize;
use std::collections::HashSet;
use std::io::Cursor;
use wasm_bindgen::prelude::*;

use crate::known_tools;

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

const SUPPORTED_IMAGE_FORMATS: &[&str] = &[
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
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
    ("dreamina", "dreamina"),
    ("jimeng", "jimeng"),
    ("qwen", "qwen"),
];

const EXIF_AIGC_PRODUCER_PREFIXES: &[(&str, &str)] = &[("001191110000802100433B", "qwen")];

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
    supported: bool,
    ai_generated: bool,
    overall_confidence: String,
    signals: Vec<BrowserSignal>,
    supported_platforms: Vec<String>,
    supported_formats: Vec<String>,
    supported_signal_types: Vec<String>,
    limitations: Vec<String>,
}

#[derive(Serialize)]
struct BrowserCapabilities {
    supported_platforms: Vec<String>,
    supported_formats: Vec<String>,
    supported_signal_types: Vec<String>,
    disclaimer: String,
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
    let payload = BrowserCapabilities {
        supported_platforms: IMAGE_PLATFORMS.iter().map(|s| s.to_string()).collect(),
        supported_formats: SUPPORTED_IMAGE_FORMATS
            .iter()
            .map(|s| s.to_string())
            .collect(),
        supported_signal_types: supported_signal_types(),
        disclaimer: browser_disclaimer(),
    };

    serde_wasm_bindgen::to_value(&payload).map_err(js_err)
}

#[wasm_bindgen(js_name = analyzeImage)]
pub fn analyze_image(bytes: &[u8], file_name: Option<String>) -> Result<JsValue, JsValue> {
    let Some(mime_type) = detect_image_mime(bytes) else {
        return Err(JsValue::from_str(
            "当前浏览器版仅支持 JPEG / PNG / WebP / GIF / BMP / TIFF 图片。",
        ));
    };

    let mut signals = Vec::new();
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

    let overall_confidence = signals
        .iter()
        .map(|signal| signal.confidence.clone())
        .max_by_key(|confidence| confidence_rank(confidence))
        .unwrap_or_else(|| "none".to_string());

    let report = BrowserReport {
        mode: "browser-image-alpha".to_string(),
        file_name,
        mime_type: mime_type.to_string(),
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
        limitations: vec![
            "这不是万能 AI 鉴定器，只基于元数据和启发式信号判断。".to_string(),
            "如果图片经过平台压缩、截图、转存或清洗元数据，很多信号会消失。".to_string(),
            "当前浏览器版优先支持图片元数据检测，不包含完整的桌面 CLI 能力。".to_string(),
            "未检测到 AI 信号，不等于图片一定不是 AI 生成。".to_string(),
            "当前仅支持检测上方列出的平台/工具相关来源信号，不应外推到所有生成模型。"
                .to_string(),
        ],
    };

    serde_wasm_bindgen::to_value(&report).map_err(js_err)
}

fn browser_disclaimer() -> String {
    "当前浏览器版只检测图片里的 EXIF / XMP / PNG 文本块 / 文件名等来源信号。它不是万能 AI 鉴定器，只能覆盖已知、且仍然保留在文件中的平台痕迹。".to_string()
}

fn supported_signal_types() -> Vec<String> {
    vec![
        "EXIF metadata".to_string(),
        "XMP / IPTC metadata".to_string(),
        "PNG tEXt / iTXt chunks".to_string(),
        "Filename heuristics".to_string(),
    ]
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

fn detect_xmp(bytes: &[u8]) -> Vec<BrowserSignal> {
    let search_data = if bytes.len() > 1_048_576 {
        &bytes[..1_048_576]
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
        let is_hex_hash = value.len() >= 32 && value.chars().all(|c| c.is_ascii_hexdigit() || c == '-');
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
    let mut pos = 8usize;

    while pos + 12 <= bytes.len() {
        let length = u32::from_be_bytes([bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]]) as usize;
        let chunk_type = &bytes[pos + 4..pos + 8];
        let chunk_data_end = pos + 8 + length;
        if chunk_data_end > bytes.len() {
            break;
        }
        let chunk_data = &bytes[pos + 8..chunk_data_end];

        match chunk_type {
            b"tEXt" => {
                if let Some(null_pos) = chunk_data.iter().position(|&b| b == 0) {
                    if let (Ok(keyword), Ok(value)) = (
                        std::str::from_utf8(&chunk_data[..null_pos]),
                        std::str::from_utf8(&chunk_data[null_pos + 1..]),
                    ) {
                        append_png_text_signal(keyword, value, &mut signals);
                    }
                }
            }
            b"iTXt" => {
                if let Some(null_pos) = chunk_data.iter().position(|&b| b == 0) {
                    if let Ok(keyword) = std::str::from_utf8(&chunk_data[..null_pos]) {
                        let rest = &chunk_data[null_pos + 1..];
                        let mut nulls_found = 0;
                        let mut text_start = 0;
                        for (idx, byte) in rest.iter().enumerate() {
                            if *byte == 0 {
                                nulls_found += 1;
                                if nulls_found == 3 {
                                    text_start = idx + 1;
                                    break;
                                }
                            }
                        }
                        if text_start > 0 && text_start < rest.len() {
                            if let Ok(value) = std::str::from_utf8(&rest[text_start..]) {
                                append_png_text_signal(keyword, value, &mut signals);
                            }
                        }
                    }
                }
            }
            b"IEND" => break,
            _ => {}
        }

        pos = chunk_data_end + 4;
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
    haystack.windows(needle.len()).position(|window| window == needle)
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
    let search_data = if bytes.len() > 1_048_576 {
        &bytes[..1_048_576]
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

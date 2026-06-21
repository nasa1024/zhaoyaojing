use crate::known_tools;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)]
pub(crate) enum CoreConfidence {
    Low,
    Medium,
    High,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum Mp4HitKind {
    ToolMatch { label: String, value: String },
    AigcLabel { produce_id: Option<String> },
    SeiMarker { marker: String },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct Mp4MetadataHit {
    pub confidence: CoreConfidence,
    pub kind: Mp4HitKind,
    pub tool: Option<String>,
    pub details: Vec<(String, String)>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
#[allow(dead_code)]
pub(crate) struct Mp4BoxSummary {
    pub path: String,
    pub box_type: String,
    pub offset: usize,
    pub size: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
#[allow(dead_code)]
pub(crate) struct Mp4Inspection {
    pub major_brand: Option<String>,
    pub minor_version: Option<u32>,
    pub compatible_brands: Vec<String>,
    pub boxes: Vec<Mp4BoxSummary>,
    pub ilst_entries: Vec<(String, String)>,
    pub hits: Vec<Mp4MetadataHit>,
    pub has_c2pa_or_jumbf_text: bool,
}

const MP4_TOOL_MAPPINGS: &[(&str, &str, CoreConfidence)] =
    &[("google", "google veo", CoreConfidence::Medium)];

const AIGC_PRODUCER_MAPPINGS: &[(&str, &str)] = &[("001191330106MA2CFLDG4R10001", "wan")];

const SEI_MARKERS: &[(&[u8], &str)] = &[
    (b"kling-ai", "kling"),
    (b"sora", "sora"),
    (b"runway", "runway"),
    (b"pika-labs", "pika"),
    (b"luma-ai", "luma"),
    (b"hailuo", "hailuo"),
    (b"pixverse", "pixverse"),
    (b"vidu-ai", "vidu"),
    (b"genmo", "genmo"),
    (b"haiper", "haiper"),
];

#[allow(dead_code)]
struct BoxInfo {
    box_start: usize,
    box_type: [u8; 4],
    content_start: usize,
    box_end: usize,
}

pub(crate) fn is_mp4_like(data: &[u8]) -> bool {
    get_box(data, 0, data.len().min(64), b"ftyp").is_some()
}

pub(crate) fn detect(data: &[u8]) -> Vec<Mp4MetadataHit> {
    if !is_mp4_like(data) {
        return Vec::new();
    }

    let entries = extract_ilst_entries(data);
    let mut hits = Vec::new();
    hits.extend(detect_ilst_tools(&entries));
    hits.extend(detect_aigc_label(&entries));
    hits.extend(detect_sei_markers(data));
    hits
}

#[allow(dead_code)]
pub(crate) fn inspect(data: &[u8]) -> Mp4Inspection {
    if !is_mp4_like(data) {
        return Mp4Inspection {
            major_brand: None,
            minor_version: None,
            compatible_brands: Vec::new(),
            boxes: Vec::new(),
            ilst_entries: Vec::new(),
            hits: Vec::new(),
            has_c2pa_or_jumbf_text: false,
        };
    }

    let (major_brand, minor_version, compatible_brands) = parse_ftyp(data);
    let ilst_entries = extract_ilst_entries(data);
    let hits = detect(data);
    let mut boxes = Vec::new();
    summarize_boxes(data, 0, data.len(), "", 0, &mut boxes);
    Mp4Inspection {
        major_brand,
        minor_version,
        compatible_brands,
        boxes,
        ilst_entries,
        hits,
        has_c2pa_or_jumbf_text: contains_ascii_case(data, b"c2pa")
            || contains_ascii_case(data, b"jumbf")
            || contains_ascii_case(data, b"manifest"),
    }
}

fn read_u32_be(data: &[u8], offset: usize) -> Option<u32> {
    if offset + 4 > data.len() {
        return None;
    }
    Some(u32::from_be_bytes([
        data[offset],
        data[offset + 1],
        data[offset + 2],
        data[offset + 3],
    ]))
}

fn find_boxes(data: &[u8], start: usize, end: usize) -> Vec<BoxInfo> {
    let mut boxes = Vec::new();
    let mut pos = start;
    while pos + 8 <= end {
        let size = match read_u32_be(data, pos) {
            Some(s) => s as u64,
            None => break,
        };
        let mut box_type = [0u8; 4];
        box_type.copy_from_slice(&data[pos + 4..pos + 8]);
        let (content_start, actual_size) = if size == 1 {
            if pos + 16 > end {
                break;
            }
            let ext = u64::from_be_bytes([
                data[pos + 8],
                data[pos + 9],
                data[pos + 10],
                data[pos + 11],
                data[pos + 12],
                data[pos + 13],
                data[pos + 14],
                data[pos + 15],
            ]);
            (pos + 16, ext)
        } else if size == 0 {
            (pos + 8, (end - pos) as u64)
        } else {
            (pos + 8, size)
        };
        if actual_size < 8 {
            break;
        }
        let box_end = (pos as u64 + actual_size).min(end as u64) as usize;
        boxes.push(BoxInfo {
            box_start: pos,
            box_type,
            content_start,
            box_end,
        });
        pos = box_end;
    }
    boxes
}

fn get_box(data: &[u8], start: usize, end: usize, box_type: &[u8; 4]) -> Option<(usize, usize)> {
    find_boxes(data, start, end)
        .into_iter()
        .find(|b| &b.box_type == box_type)
        .map(|b| (b.content_start, b.box_end))
}

fn box_type_to_string(box_type: &[u8; 4]) -> String {
    box_type.iter().map(|&b| b as char).collect()
}

#[allow(dead_code)]
fn parse_ftyp(data: &[u8]) -> (Option<String>, Option<u32>, Vec<String>) {
    let Some((start, end)) = get_box(data, 0, data.len().min(512), b"ftyp") else {
        return (None, None, Vec::new());
    };
    if start + 8 > end {
        return (None, None, Vec::new());
    }
    let major_brand = std::str::from_utf8(&data[start..start + 4])
        .ok()
        .map(|s| s.to_string());
    let minor_version = read_u32_be(data, start + 4);
    let mut compatible_brands = Vec::new();
    let mut pos = start + 8;
    while pos + 4 <= end {
        if let Ok(brand) = std::str::from_utf8(&data[pos..pos + 4]) {
            compatible_brands.push(brand.to_string());
        }
        pos += 4;
    }
    (major_brand, minor_version, compatible_brands)
}

#[allow(dead_code)]
fn summarize_boxes(
    data: &[u8],
    start: usize,
    end: usize,
    parent: &str,
    depth: usize,
    out: &mut Vec<Mp4BoxSummary>,
) {
    if depth > 5 || out.len() >= 240 {
        return;
    }

    for item in find_boxes(data, start, end) {
        if out.len() >= 240 {
            return;
        }
        let box_type = box_type_to_string(&item.box_type);
        let path = if parent.is_empty() {
            box_type.clone()
        } else {
            format!("{parent}/{box_type}")
        };
        out.push(Mp4BoxSummary {
            path: path.clone(),
            box_type: box_type.clone(),
            offset: item.box_start,
            size: item.box_end.saturating_sub(item.box_start),
        });

        let child_start = if &item.box_type == b"meta" {
            (item.content_start + 4).min(item.box_end)
        } else {
            item.content_start
        };
        if is_container_box(&item.box_type) && child_start < item.box_end {
            summarize_boxes(data, child_start, item.box_end, &path, depth + 1, out);
        }
    }
}

#[allow(dead_code)]
fn is_container_box(box_type: &[u8; 4]) -> bool {
    matches!(
        box_type,
        b"moov"
            | b"trak"
            | b"mdia"
            | b"minf"
            | b"stbl"
            | b"udta"
            | b"meta"
            | b"ilst"
            | b"edts"
            | b"dinf"
    )
}

#[allow(dead_code)]
fn contains_ascii_case(data: &[u8], needle: &[u8]) -> bool {
    if needle.is_empty() || data.len() < needle.len() {
        return false;
    }
    data.windows(needle.len())
        .any(|window| window.eq_ignore_ascii_case(needle))
}

fn parse_ilst_standard(data: &[u8], start: usize, end: usize) -> Vec<(String, String)> {
    let mut results = Vec::new();
    for item in find_boxes(data, start, end) {
        let key = box_type_to_string(&item.box_type);
        if let Some((data_cs, data_ce)) = get_box(data, item.content_start, item.box_end, b"data") {
            if data_ce - data_cs >= 8 {
                let value = String::from_utf8_lossy(&data[data_cs + 8..data_ce])
                    .trim_matches('\0')
                    .to_string();
                if !value.is_empty() {
                    results.push((key, value));
                }
            }
        }
    }
    results
}

fn parse_keys(data: &[u8], start: usize, end: usize) -> Vec<String> {
    if end - start < 8 {
        return vec![];
    }
    let count = match read_u32_be(data, start + 4) {
        Some(c) => c as usize,
        None => return vec![],
    };
    let mut keys = Vec::with_capacity(count);
    let mut offset = start + 8;
    for _ in 0..count {
        if offset + 8 > end {
            break;
        }
        let key_size = match read_u32_be(data, offset) {
            Some(s) => s as usize,
            None => break,
        };
        if key_size < 8 || offset + key_size > end {
            break;
        }
        let name = String::from_utf8_lossy(&data[offset + 8..offset + key_size]).to_string();
        keys.push(name);
        offset += key_size;
    }
    keys
}

fn parse_ilst_keyed(
    data: &[u8],
    keys: &[String],
    ilst_start: usize,
    ilst_end: usize,
) -> Vec<(String, String)> {
    let mut results = Vec::new();
    for item in find_boxes(data, ilst_start, ilst_end) {
        let idx = u32::from_be_bytes(item.box_type) as usize;
        let key_name = if idx > 0 && idx <= keys.len() {
            keys[idx - 1].clone()
        } else {
            format!("idx:{}", idx)
        };
        if let Some((data_cs, data_ce)) = get_box(data, item.content_start, item.box_end, b"data") {
            if data_ce - data_cs >= 8 {
                let value = String::from_utf8_lossy(&data[data_cs + 8..data_ce])
                    .trim_matches('\0')
                    .to_string();
                if !value.is_empty() {
                    results.push((key_name, value));
                }
            }
        }
    }
    results
}

fn extract_ilst_entries(data: &[u8]) -> Vec<(String, String)> {
    let moov = match get_box(data, 0, data.len(), b"moov") {
        Some(m) => m,
        None => return vec![],
    };
    let udta = match get_box(data, moov.0, moov.1, b"udta") {
        Some(u) => u,
        None => return vec![],
    };
    let meta = match get_box(data, udta.0, udta.1, b"meta") {
        Some(m) => m,
        None => return vec![],
    };
    let meta_content = meta.0 + 4;
    if meta_content >= meta.1 {
        return vec![];
    }
    let keys_box = get_box(data, meta_content, meta.1, b"keys");
    let ilst = match get_box(data, meta_content, meta.1, b"ilst") {
        Some(i) => i,
        None => return vec![],
    };
    if let Some((keys_start, keys_end)) = keys_box {
        let keys = parse_keys(data, keys_start, keys_end);
        parse_ilst_keyed(data, &keys, ilst.0, ilst.1)
    } else {
        parse_ilst_standard(data, ilst.0, ilst.1)
    }
}

fn detect_ilst_tools(entries: &[(String, String)]) -> Vec<Mp4MetadataHit> {
    let mut hits = Vec::new();
    let tool_keys: &[&str] = &["\u{a9}too", "\u{a9}swr", "encoder", "tool", "software"];
    for (key, value) in entries {
        let is_tool_key = tool_keys.iter().any(|tk| key.eq_ignore_ascii_case(tk));
        if !is_tool_key {
            continue;
        }
        let label = match key.as_str() {
            "\u{a9}too" => "Encoding Tool",
            "\u{a9}swr" => "Software",
            _ => key.as_str(),
        };
        if let Some(tool_name) = known_tools::match_ai_tool(value) {
            hits.push(Mp4MetadataHit {
                confidence: CoreConfidence::Medium,
                kind: Mp4HitKind::ToolMatch {
                    label: label.to_string(),
                    value: value.clone(),
                },
                tool: Some(tool_name.to_string()),
                details: vec![(key.clone(), value.clone())],
            });
            continue;
        }
        let lower = value.to_lowercase();
        for &(pattern, mapped_tool, confidence) in MP4_TOOL_MAPPINGS {
            if lower == pattern {
                hits.push(Mp4MetadataHit {
                    confidence,
                    kind: Mp4HitKind::ToolMatch {
                        label: label.to_string(),
                        value: value.clone(),
                    },
                    tool: Some(mapped_tool.to_string()),
                    details: vec![(key.clone(), value.clone())],
                });
                break;
            }
        }
    }
    hits
}

fn detect_aigc_label(entries: &[(String, String)]) -> Vec<Mp4MetadataHit> {
    let mut hits = Vec::new();
    for (key, value) in entries {
        if !key.eq_ignore_ascii_case("AIGC") {
            continue;
        }
        let has_ai_label = value.contains("\"Label\":\"1\"") || value.contains("\"Label\": \"1\"");
        if !has_ai_label {
            continue;
        }
        let produce_id = extract_json_field(value, "ProduceID");
        let content_producer = extract_json_field(value, "ContentProducer");
        let tool = content_producer.as_deref().and_then(|cp| {
            AIGC_PRODUCER_MAPPINGS
                .iter()
                .find(|(id, _)| cp == *id)
                .map(|(_, tool)| tool.to_string())
        });
        let mut details = vec![("AIGC".to_string(), value.clone())];
        if let Some(ref pid) = produce_id {
            details.push(("ProduceID".to_string(), pid.clone()));
        }
        hits.push(Mp4MetadataHit {
            confidence: CoreConfidence::Medium,
            kind: Mp4HitKind::AigcLabel { produce_id },
            tool,
            details,
        });
    }
    hits
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

fn detect_sei_markers(data: &[u8]) -> Vec<Mp4MetadataHit> {
    let mut hits = Vec::new();
    let mdat = match get_box(data, 0, data.len(), b"mdat") {
        Some(m) => m,
        None => return hits,
    };
    let scan_end = mdat.1.min(mdat.0 + 1_048_576);
    let scan_data = &data[mdat.0..scan_end];
    for &(marker, tool_name) in SEI_MARKERS {
        if scan_data.windows(marker.len()).any(|w| w == marker) {
            let marker_str = String::from_utf8_lossy(marker).to_string();
            hits.push(Mp4MetadataHit {
                confidence: CoreConfidence::Medium,
                kind: Mp4HitKind::SeiMarker {
                    marker: marker_str.clone(),
                },
                tool: Some(tool_name.to_string()),
                details: vec![("SEI marker".to_string(), marker_str)],
            });
        }
    }
    hits
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_json_field() {
        let json = r#"{"Label":"1","ProduceID":"abc-123","Other":"val"}"#;
        assert_eq!(extract_json_field(json, "Label"), Some("1".to_string()));
        assert_eq!(
            extract_json_field(json, "ProduceID"),
            Some("abc-123".to_string())
        );
        assert_eq!(extract_json_field(json, "Missing"), None);

        let json2 = r#"{"Label": "1", "ProduceID": "xyz"}"#;
        assert_eq!(extract_json_field(json2, "Label"), Some("1".to_string()));
        assert_eq!(
            extract_json_field(json2, "ProduceID"),
            Some("xyz".to_string())
        );
    }

    #[test]
    fn test_detect_ilst_tools_known_tool() {
        let entries = vec![("\u{a9}too".to_string(), "Runway Gen-3".to_string())];
        let hits = detect_ilst_tools(&entries);

        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].tool.as_deref(), Some("runway"));
        assert_eq!(hits[0].confidence, CoreConfidence::Medium);
        assert!(matches!(
            hits[0].kind,
            Mp4HitKind::ToolMatch { ref label, .. } if label == "Encoding Tool"
        ));
    }

    #[test]
    fn test_detect_ilst_tools_mp4_mapping() {
        let entries = vec![("\u{a9}too".to_string(), "Google".to_string())];
        let hits = detect_ilst_tools(&entries);

        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].tool.as_deref(), Some("google veo"));
    }

    #[test]
    fn test_detect_ilst_tools_no_match() {
        let entries = vec![("\u{a9}too".to_string(), "Lavf60.16.100".to_string())];
        let hits = detect_ilst_tools(&entries);

        assert!(hits.is_empty());
    }

    #[test]
    fn test_detect_keyed_encoder() {
        let entries = vec![("encoder".to_string(), "Sora v2".to_string())];
        let hits = detect_ilst_tools(&entries);

        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].tool.as_deref(), Some("sora"));
    }

    #[test]
    fn test_detect_aigc_label() {
        let entries = vec![(
            "AIGC".to_string(),
            r#"{"Label":"1","ProduceID":"test-123"}"#.to_string(),
        )];
        let hits = detect_aigc_label(&entries);

        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].confidence, CoreConfidence::Medium);
        assert!(matches!(
            hits[0].kind,
            Mp4HitKind::AigcLabel {
                produce_id: Some(ref id)
            } if id == "test-123"
        ));
        assert!(hits[0]
            .details
            .iter()
            .any(|(key, value)| key == "ProduceID" && value == "test-123"));
    }

    #[test]
    fn test_detect_aigc_label_with_wan_producer() {
        let entries = vec![(
            "AIGC".to_string(),
            r#"{"Label":"1","ContentProducer":"001191330106MA2CFLDG4R10001","ProduceID":"abc"}"#
                .to_string(),
        )];
        let hits = detect_aigc_label(&entries);

        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].tool.as_deref(), Some("wan"));
    }

    #[test]
    fn test_detect_aigc_label_not_ai() {
        let entries = vec![(
            "AIGC".to_string(),
            r#"{"Label":"0","ProduceID":"test"}"#.to_string(),
        )];
        let hits = detect_aigc_label(&entries);

        assert!(hits.is_empty());
    }
}

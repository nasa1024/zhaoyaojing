#![cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]

use crate::known_tools;

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct C2paBrowserSignal {
    pub source: &'static str,
    pub confidence: &'static str,
    pub description: String,
    pub tool: Option<String>,
    pub details: Vec<(String, String)>,
}

const PNG_SIGNATURE: &[u8; 8] = b"\x89PNG\r\n\x1a\n";
const PNG_C2PA_CHUNKS: [&[u8; 4]; 2] = [b"caBX", b"caBI"];
const JPEG_APP11: u8 = 0xEB;
const MAX_DETAIL_LEN: usize = 240;

const AI_SOURCE_TYPES: &[(&str, &str, &str)] = &[
    (
        "trainedAlgorithmicMedia",
        "high",
        "trainedAlgorithmicMedia (fully AI-generated)",
    ),
    (
        "compositeWithTrainedAlgorithmicMedia",
        "high",
        "compositeWithTrainedAlgorithmicMedia (AI-edited)",
    ),
    (
        "compositeSynthetic",
        "high",
        "compositeSynthetic (includes AI elements)",
    ),
    (
        "algorithmicMedia",
        "medium",
        "algorithmicMedia (algorithmic media)",
    ),
    (
        "dataDrivenMedia",
        "medium",
        "dataDrivenMedia (data-driven generation)",
    ),
    (
        "trainedAlgorithmicData",
        "medium",
        "trainedAlgorithmicData (AI-generated data)",
    ),
];

pub(crate) fn detect(bytes: &[u8]) -> Vec<C2paBrowserSignal> {
    let manifest_blocks = extract_manifest_blocks(bytes);
    if manifest_blocks.is_empty() {
        return Vec::new();
    }

    let mut signals = Vec::new();
    for block in manifest_blocks {
        append_manifest_signals(&block, &mut signals);
    }

    signals
}

fn append_manifest_signals(block: &[u8], signals: &mut Vec<C2paBrowserSignal>) {
    let text = String::from_utf8_lossy(block);
    let lower = text.to_lowercase();
    let sample = compact_text_sample(&text);

    for (source_type, confidence, description) in AI_SOURCE_TYPES {
        if lower.contains(&source_type.to_lowercase()) {
            signals.push(C2paBrowserSignal {
                source: "C2PA",
                confidence,
                description: format!("C2PA digitalSourceType 指向 AI 来源：{source_type}"),
                tool: known_tools::match_ai_tool(&text).map(str::to_string),
                details: vec![
                    ("digitalSourceType".to_string(), description.to_string()),
                    ("manifest_sample".to_string(), sample.clone()),
                ],
            });
            return;
        }
    }

    if let Some(tool_name) = known_tools::match_ai_tool(&text) {
        signals.push(C2paBrowserSignal {
            source: "C2PA",
            confidence: "high",
            description: format!("C2PA manifest 命中已知 AI 工具：{tool_name}"),
            tool: Some(tool_name.to_string()),
            details: vec![("manifest_sample".to_string(), sample)],
        });
        return;
    }

    if lower.contains("google") && (lower.contains("c2pa") || lower.contains("contentauth")) {
        signals.push(C2paBrowserSignal {
            source: "C2PA",
            confidence: "medium",
            description: "C2PA manifest 引用了 Google 内容凭证生成链路。".to_string(),
            tool: Some("google ai".to_string()),
            details: vec![("manifest_sample".to_string(), sample)],
        });
    }
}

fn extract_manifest_blocks(bytes: &[u8]) -> Vec<Vec<u8>> {
    if bytes.starts_with(PNG_SIGNATURE) {
        extract_png_c2pa_chunks(bytes)
    } else if bytes.starts_with(&[0xFF, 0xD8]) {
        extract_jpeg_c2pa_segments(bytes)
    } else if crate::mp4_metadata_core::is_mp4_like(bytes) {
        extract_mp4_c2pa_blocks(bytes)
    } else {
        Vec::new()
    }
}

fn extract_mp4_c2pa_blocks(bytes: &[u8]) -> Vec<Vec<u8>> {
    let scan_end = bytes.len().min(2 * 1_048_576);
    let scan = &bytes[..scan_end];
    let lower = String::from_utf8_lossy(scan).to_lowercase();
    let has_c2pa_text = lower.contains("c2pa")
        || lower.contains("digital sourcetype")
        || lower.contains("digitalsourcetype")
        || lower.contains("claim_generator")
        || lower.contains("contentauth");
    if has_c2pa_text {
        vec![scan.to_vec()]
    } else {
        Vec::new()
    }
}

fn extract_png_c2pa_chunks(bytes: &[u8]) -> Vec<Vec<u8>> {
    let mut blocks = Vec::new();
    let mut pos = PNG_SIGNATURE.len();

    while pos + 12 <= bytes.len() {
        let length =
            u32::from_be_bytes([bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]])
                as usize;
        let chunk_type = &bytes[pos + 4..pos + 8];
        let data_start = pos + 8;
        let data_end = data_start.saturating_add(length);
        if data_end > bytes.len() {
            break;
        }

        if PNG_C2PA_CHUNKS.iter().any(|name| chunk_type == *name) {
            blocks.push(bytes[data_start..data_end].to_vec());
        }
        if chunk_type == b"IEND" {
            break;
        }

        pos = data_end.saturating_add(4);
    }

    blocks
}

fn extract_jpeg_c2pa_segments(bytes: &[u8]) -> Vec<Vec<u8>> {
    let mut blocks = Vec::new();
    let mut current_en: Option<[u8; 2]> = None;
    let mut current = Vec::new();
    let mut pos = 2usize;

    while pos + 4 <= bytes.len() {
        if bytes[pos] != 0xFF {
            pos += 1;
            continue;
        }

        while pos < bytes.len() && bytes[pos] == 0xFF {
            pos += 1;
        }
        if pos >= bytes.len() {
            break;
        }

        let marker = bytes[pos];
        pos += 1;
        if marker == 0xD9 || marker == 0xDA {
            break;
        }
        if marker == 0x00 || (0xD0..=0xD7).contains(&marker) {
            continue;
        }
        if pos + 2 > bytes.len() {
            break;
        }

        let segment_len = u16::from_be_bytes([bytes[pos], bytes[pos + 1]]) as usize;
        pos += 2;
        if segment_len < 2 {
            break;
        }

        let payload_len = segment_len - 2;
        if pos + payload_len > bytes.len() {
            break;
        }
        let payload = &bytes[pos..pos + payload_len];

        if marker == JPEG_APP11 {
            if let Some((en, part, starts_new_block)) = parse_jpeg_c2pa_payload(payload) {
                if starts_new_block || current_en != Some(en) {
                    if !current.is_empty() {
                        blocks.push(std::mem::take(&mut current));
                    }
                    current_en = Some(en);
                }
                current.extend_from_slice(part);
            } else if !current.is_empty() {
                blocks.push(std::mem::take(&mut current));
                current_en = None;
            }
        }

        pos += payload_len;
    }

    if !current.is_empty() {
        blocks.push(current);
    }

    blocks
}

fn parse_jpeg_c2pa_payload(payload: &[u8]) -> Option<([u8; 2], &[u8], bool)> {
    if payload.len() <= 16 || &payload[0..2] != b"JP" {
        return None;
    }

    let en = [payload[2], payload[3]];
    let sequence = u32::from_be_bytes([payload[4], payload[5], payload[6], payload[7]]);
    let starts_new_block = sequence == 1 && payload.len() > 28 && &payload[24..28] == b"c2pa";

    if starts_new_block {
        Some((en, &payload[8..], true))
    } else if sequence > 1 {
        Some((en, &payload[16..], false))
    } else {
        None
    }
}

fn compact_text_sample(text: &str) -> String {
    let compact = text
        .chars()
        .map(|ch| {
            if ch.is_ascii_graphic() || ch == ' ' {
                ch
            } else {
                ' '
            }
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");
    truncate(&compact, MAX_DETAIL_LEN)
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

#[cfg(test)]
mod tests {
    use super::*;

    fn png_with_chunk(chunk_type: &[u8; 4], data: &[u8]) -> Vec<u8> {
        let mut png = Vec::new();
        png.extend_from_slice(PNG_SIGNATURE);
        append_png_chunk(&mut png, b"IHDR", &[0; 13]);
        append_png_chunk(&mut png, chunk_type, data);
        append_png_chunk(&mut png, b"IEND", &[]);
        png
    }

    fn append_png_chunk(png: &mut Vec<u8>, chunk_type: &[u8; 4], data: &[u8]) {
        png.extend_from_slice(&(data.len() as u32).to_be_bytes());
        png.extend_from_slice(chunk_type);
        png.extend_from_slice(data);
        png.extend_from_slice(&0u32.to_be_bytes());
    }

    fn jpeg_with_app11_manifest(manifest: &[u8]) -> Vec<u8> {
        let mut jumbf = vec![0u8; 28];
        jumbf[4..8].copy_from_slice(b"jumb");
        jumbf[16..20].copy_from_slice(b"c2pa");
        jumbf.extend_from_slice(manifest);

        let mut payload = Vec::new();
        payload.extend_from_slice(b"JP");
        payload.extend_from_slice(&[0x02, 0x11]);
        payload.extend_from_slice(&1u32.to_be_bytes());
        payload.extend_from_slice(&jumbf);

        let mut jpeg = vec![0xFF, 0xD8, 0xFF, JPEG_APP11];
        jpeg.extend_from_slice(&((payload.len() + 2) as u16).to_be_bytes());
        jpeg.extend_from_slice(&payload);
        jpeg.extend_from_slice(&[0xFF, 0xD9]);
        jpeg
    }

    #[test]
    fn detects_google_ai_from_png_c2pa_manifest_chunk() {
        let png = png_with_chunk(
            b"caBX",
            br#"claim_generator Google C2PA Core Generator Library c2pa.actions.v2"#,
        );

        let signals = detect(&png);

        assert_eq!(signals.len(), 1);
        assert_eq!(signals[0].source, "C2PA");
        assert_eq!(signals[0].confidence, "medium");
        assert_eq!(signals[0].tool.as_deref(), Some("google ai"));
    }

    #[test]
    fn detects_digital_source_type_from_png_c2pa_manifest_chunk() {
        let png = png_with_chunk(
            b"caBX",
            br#"c2pa.actions.v2 digitalSourceType trainedAlgorithmicMedia"#,
        );

        let signals = detect(&png);

        assert_eq!(signals.len(), 1);
        assert_eq!(signals[0].confidence, "high");
        assert!(signals[0]
            .details
            .iter()
            .any(|(key, value)| key == "digitalSourceType" && value.contains("fully AI")));
    }

    #[test]
    fn detects_imagen_from_jpeg_app11_c2pa_manifest() {
        let jpeg = jpeg_with_app11_manifest(
            br#"claim_generator_info Google Imagen digitalSourceType trainedAlgorithmicMedia"#,
        );

        let signals = detect(&jpeg);

        assert_eq!(signals.len(), 1);
        assert_eq!(signals[0].confidence, "high");
        assert_eq!(signals[0].tool.as_deref(), Some("imagen"));
    }

    #[test]
    fn ignores_git_lfs_pointer_text() {
        let pointer = b"version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 1202004\n";
        assert!(detect(pointer).is_empty());
    }

    fn mp4_box(box_type: &[u8; 4], payload: &[u8]) -> Vec<u8> {
        let mut out = Vec::new();
        let size = (8 + payload.len()) as u32;
        out.extend_from_slice(&size.to_be_bytes());
        out.extend_from_slice(box_type);
        out.extend_from_slice(payload);
        out
    }

    #[test]
    fn detects_video_c2pa_text_in_mp4_container() {
        let mut mp4 = mp4_box(b"ftyp", b"isom\0\0\0\0isommp42");
        mp4.extend_from_slice(&mp4_box(
            b"uuid",
            br#"c2pa.actions.v2 digitalSourceType trainedAlgorithmicMedia claim_generator Sora"#,
        ));

        let signals = detect(&mp4);

        assert_eq!(signals.len(), 1);
        assert_eq!(signals[0].source, "C2PA");
        assert_eq!(signals[0].confidence, "high");
        assert_eq!(signals[0].tool.as_deref(), Some("sora"));
    }
}

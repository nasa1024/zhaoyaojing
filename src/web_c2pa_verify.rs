#![cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]

use serde::Serialize;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum ProvenanceState {
    Trusted,
    Valid,
    Invalid,
    Unsigned,
}

pub(crate) fn provenance_state_str(state: ProvenanceState) -> &'static str {
    match state {
        ProvenanceState::Trusted => "trusted",
        ProvenanceState::Valid => "valid",
        ProvenanceState::Invalid => "invalid",
        ProvenanceState::Unsigned => "unsigned",
    }
}

#[derive(Serialize, Clone, Default)]
pub(crate) struct ValidationIssue {
    pub code: String,
    pub url: Option<String>,
    pub explanation: Option<String>,
}

#[derive(Serialize, Clone, Default)]
pub(crate) struct ProvenanceManifest {
    pub title: Option<String>,
    pub format: Option<String>,
    pub claim_generator: Option<String>,
    pub digital_source_type: Option<String>,
    pub assertions: Vec<String>,
}

#[derive(Serialize, Clone)]
pub(crate) struct Provenance {
    pub state: String,
    pub manifest: Option<ProvenanceManifest>,
    pub validation_status: Vec<ValidationIssue>,
    pub raw_json: Option<String>,
}

impl Default for Provenance {
    fn default() -> Self {
        Provenance {
            state: provenance_state_str(ProvenanceState::Unsigned).to_string(),
            manifest: None,
            validation_status: Vec::new(),
            raw_json: None,
        }
    }
}

#[cfg(target_arch = "wasm32")]
pub(crate) fn verify_provenance(bytes: &[u8], mime: &str) -> Provenance {
    use c2pa::{Reader, ValidationState};
    use std::io::Cursor;

    #[allow(deprecated)]
    let reader = match Reader::from_stream(mime, Cursor::new(bytes)) {
        Ok(reader) => reader,
        Err(_) => return Provenance::default(), // no manifest / unsupported => unsigned
    };

    // c2pa 0.82 ValidationState: Trusted, Valid, Invalid only (no Unsigned variant)
    // Unsigned case is handled above by Err from from_stream
    let state = match reader.validation_state() {
        ValidationState::Trusted => ProvenanceState::Trusted,
        ValidationState::Valid => ProvenanceState::Valid,
        ValidationState::Invalid => ProvenanceState::Invalid,
    };

    let mut validation_status = Vec::new();
    if let Some(statuses) = reader.validation_status() {
        for s in statuses {
            validation_status.push(ValidationIssue {
                code: s.code().to_string(),
                url: s.url().map(|u| u.to_string()),
                explanation: s.explanation().map(|e| e.to_string()),
            });
        }
    }

    // Capture raw JSON once before borrowing active_manifest
    let raw_json = reader.json();
    let digital_source_type_value = extract_digital_source_type(&raw_json);

    // Extract manifest info from active_manifest
    let manifest = reader.active_manifest().map(|m| {
        // claim_generator() and format() return Option<&str> in c2pa 0.82
        let claim_generator = m.claim_generator().map(|s| s.to_string());

        // Collect assertion labels
        let assertion_labels: Vec<String> = m
            .assertions()
            .iter()
            .map(|a| a.label().to_string())
            .collect();

        ProvenanceManifest {
            title: m.title().map(|t| t.to_string()),
            format: m.format().map(|f| f.to_string()),
            claim_generator,
            digital_source_type: digital_source_type_value.clone(),
            assertions: assertion_labels,
        }
    });

    Provenance {
        state: provenance_state_str(state).to_string(),
        manifest,
        validation_status,
        raw_json: Some(raw_json),
    }
}

/// Extract the `digitalSourceType` **value** (an IPTC URL or bare token) from a C2PA manifest
/// JSON string. Searches for `"digitalSourceType"` key in the JSON and returns the associated
/// string value. Returns `None` if the key is absent or the value is not a string.
pub(crate) fn extract_digital_source_type(manifest_json: &str) -> Option<String> {
    // Simple scan: find the literal key, then extract the quoted string value that follows.
    // This avoids pulling in a JSON parser dependency and works for the real c2pa JSON shape.
    let key = "\"digitalSourceType\"";
    let key_pos = manifest_json.find(key)?;
    let after_key = &manifest_json[key_pos + key.len()..];
    // Skip optional whitespace and colon
    let after_colon = after_key.trim_start_matches(|c: char| c.is_whitespace() || c == ':').trim_start();
    if after_colon.starts_with('"') {
        let inner = &after_colon[1..];
        let end = inner.find('"')?;
        let value = &inner[..end];
        if !value.is_empty() {
            return Some(value.to_string());
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(target_arch = "wasm32")]
    use wasm_bindgen_test::*;

    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test)]
    #[cfg_attr(not(target_arch = "wasm32"), test)]
    fn maps_validation_states_to_stable_strings() {
        assert_eq!(provenance_state_str(ProvenanceState::Trusted), "trusted");
        assert_eq!(provenance_state_str(ProvenanceState::Valid), "valid");
        assert_eq!(provenance_state_str(ProvenanceState::Invalid), "invalid");
        assert_eq!(provenance_state_str(ProvenanceState::Unsigned), "unsigned");
    }

    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test)]
    #[cfg_attr(not(target_arch = "wasm32"), test)]
    fn provenance_default_is_unsigned_empty() {
        let p = Provenance::default();
        assert_eq!(p.state, "unsigned");
        assert!(p.manifest.is_none());
        assert!(p.validation_status.is_empty());
    }

    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test)]
    #[cfg_attr(not(target_arch = "wasm32"), test)]
    fn extract_digital_source_type_finds_iptc_url() {
        let json = r#"{"assertions":[{"label":"c2pa.actions","data":{"actions":[{"action":"c2pa.created","digitalSourceType":"http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"}]}}]}"#;
        let result = extract_digital_source_type(json);
        assert!(result.is_some(), "expected Some but got None");
        let val = result.unwrap();
        assert!(val.contains("trainedAlgorithmicMedia"), "value='{}' missing trainedAlgorithmicMedia", val);
    }

    #[cfg_attr(target_arch = "wasm32", wasm_bindgen_test)]
    #[cfg_attr(not(target_arch = "wasm32"), test)]
    fn extract_digital_source_type_returns_none_when_absent() {
        let json = r#"{"assertions":[{"label":"c2pa.actions","data":{"actions":[{"action":"c2pa.created"}]}}]}"#;
        assert_eq!(extract_digital_source_type(json), None);
    }
}

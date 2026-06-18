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

    // Extract manifest info from active_manifest
    let manifest = reader.active_manifest().map(|m| {
        // claim_generator() and format() return Option<&str> in c2pa 0.82
        let claim_generator = m.claim_generator().map(|s| s.to_string());

        // Collect assertion labels; look for digitalSourceType
        let assertion_labels: Vec<String> = m
            .assertions()
            .iter()
            .map(|a| a.label().to_string())
            .collect();

        let digital_source_type = assertion_labels
            .iter()
            .find(|label| label.to_lowercase().contains("digitalsourcetype"))
            .cloned();

        ProvenanceManifest {
            title: m.title().map(|t| t.to_string()),
            format: m.format().map(|f| f.to_string()),
            claim_generator,
            digital_source_type,
            assertions: assertion_labels,
        }
    });

    Provenance {
        state: provenance_state_str(state).to_string(),
        manifest,
        validation_status,
        raw_json: Some(reader.json()),
    }
}

#[cfg(target_arch = "wasm32")]
#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn maps_validation_states_to_stable_strings() {
        assert_eq!(provenance_state_str(ProvenanceState::Trusted), "trusted");
        assert_eq!(provenance_state_str(ProvenanceState::Valid), "valid");
        assert_eq!(provenance_state_str(ProvenanceState::Invalid), "invalid");
        assert_eq!(provenance_state_str(ProvenanceState::Unsigned), "unsigned");
    }

    #[wasm_bindgen_test]
    fn provenance_default_is_unsigned_empty() {
        let p = Provenance::default();
        assert_eq!(p.state, "unsigned");
        assert!(p.manifest.is_none());
        assert!(p.validation_status.is_empty());
    }
}

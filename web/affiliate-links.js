const SUB_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const SLUG_PATTERN = /^[a-z0-9-]+$/i;
const PARAM_NAME_PATTERN = /^[a-zA-Z0-9_.-]{1,64}$/;

export const DEFAULT_SUB_ID_PARAMS = Object.freeze({
  subId1: 'subId1',
  subId2: 'subId2',
  subId3: 'subId3',
});

/**
 * Approved affiliate partner registry keyed by `/go/<slug>`.
 *
 * Placeholder entries ship disabled (`enabled: false`) with empty `url`
 * values so no unapproved or dummy external link can ever live-redirect
 * until an approved Impact.com tracking URL is configured and enabled.
 */
export const AFFILIATE_PARTNERS = Object.freeze({
  'adobe-firefly': Object.freeze({
    // Replace `url` with your approved Impact.com tracking URL (https://...) before setting `enabled: true`.
    url: '',
    enabled: false,
    subIdParams: Object.freeze({ ...DEFAULT_SUB_ID_PARAMS }),
  }),
  canva: Object.freeze({
    // Replace `url` with your approved Impact.com tracking URL (https://...) before setting `enabled: true`.
    url: '',
    enabled: false,
    subIdParams: Object.freeze({ ...DEFAULT_SUB_ID_PARAMS }),
  }),
  elevenlabs: Object.freeze({
    // Replace `url` with your approved Impact.com tracking URL (https://...) before setting `enabled: true`.
    url: '',
    enabled: false,
    subIdParams: Object.freeze({ ...DEFAULT_SUB_ID_PARAMS }),
  }),
});

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseOverrides(overrides) {
  if (overrides === undefined || overrides === null) return { ok: true, map: null };
  if (typeof overrides === 'string') {
    const trimmed = overrides.trim();
    if (!trimmed) return { ok: true, map: null };
    try {
      const parsed = JSON.parse(trimmed);
      return isPlainObject(parsed) ? { ok: true, map: parsed } : { ok: false, map: null };
    } catch {
      return { ok: false, map: null };
    }
  }
  return isPlainObject(overrides) ? { ok: true, map: overrides } : { ok: false, map: null };
}

function findOwnEntry(map, slug) {
  if (!map) return undefined;
  if (Object.hasOwn(map, slug)) return map[slug];
  const lower = slug.toLowerCase();
  if (Object.hasOwn(map, lower)) return map[lower];
  for (const key of Object.keys(map)) {
    if (key.toLowerCase() === lower) return map[key];
  }
  return undefined;
}

function toSearchParams(input) {
  if (!input) return new URLSearchParams();
  if (input instanceof URLSearchParams) return input;
  if (typeof input === 'string') return new URLSearchParams(input);
  if (typeof input === 'object') {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
    return params;
  }
  return new URLSearchParams();
}

/**
 * Trim and validate a SubID token against `[a-zA-Z0-9_-]{1,64}`.
 * Returns `null` for empty or invalid values to block CRLF/header
 * injection and accidental PII leakage.
 */
export function sanitizeSubId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!SUB_ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/**
 * Resolve an affiliate redirect destination URL for a partner slug.
 *
 * Returns a validated `https:` URL string with existing destination query
 * parameters preserved and sanitized `subId1`/`subId2`/`subId3` values
 * appended, or `null` if the partner is unknown, disabled, or invalid.
 */
export function resolveAffiliateDestination(slug, searchParams, overrides) {
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) return null;

  const baseEntry = findOwnEntry(AFFILIATE_PARTNERS, slug);
  const { ok: overridesOk, map: parsedOverrides } = parseOverrides(overrides);
  if (!overridesOk) return null;
  const hasOverride = parsedOverrides !== null && findOwnEntry(parsedOverrides, slug) !== undefined;
  const overrideEntry = hasOverride ? findOwnEntry(parsedOverrides, slug) : undefined;

  // An explicit non-object override (e.g. null or false) disables the partner.
  if (hasOverride && !isPlainObject(overrideEntry)) return null;
  if (!baseEntry && !overrideEntry) return null;

  const partner = {
    ...(isPlainObject(baseEntry) ? baseEntry : {}),
    ...(isPlainObject(overrideEntry) ? overrideEntry : {}),
    subIdParams: {
      ...DEFAULT_SUB_ID_PARAMS,
      ...(isPlainObject(baseEntry?.subIdParams) ? baseEntry.subIdParams : {}),
      ...(isPlainObject(overrideEntry?.subIdParams) ? overrideEntry.subIdParams : {}),
    },
  };

  if (partner.enabled !== true) return null;
  if (typeof partner.url !== 'string' || !partner.url.trim()) return null;

  let destination;
  try {
    destination = new URL(partner.url.trim());
  } catch {
    return null;
  }

  if (destination.protocol !== 'https:' || !destination.hostname) return null;
  if (destination.username || destination.password) return null;

  const incoming = toSearchParams(searchParams);
  const subIdValues = {
    subId1: sanitizeSubId(incoming.get('subId1')) ?? sanitizeSubId(incoming.get('locale')),
    subId2: sanitizeSubId(incoming.get('subId2')) ?? sanitizeSubId(incoming.get('placement')),
    subId3: sanitizeSubId(incoming.get('subId3')) ?? sanitizeSubId(incoming.get('state')),
  };

  for (const [slot, sanitizedValue] of Object.entries(subIdValues)) {
    if (!sanitizedValue) continue;
    const targetParam = partner.subIdParams[slot];
    if (typeof targetParam === 'string' && PARAM_NAME_PATTERN.test(targetParam)) {
      destination.searchParams.set(targetParam, sanitizedValue);
    }
  }

  return destination.toString();
}

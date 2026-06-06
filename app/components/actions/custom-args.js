export function pickArgs(entries) {
  const out = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

export function parseCsv(value) {
  if (!String(value || "").trim()) return undefined;
  return String(value).split(",").map((part) => part.trim()).filter(Boolean);
}

export function parseIntField(value) {
  if (value === "" || value == null) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export function parseBool(value) {
  if (value === "" || value == null) return undefined;
  return value === "true";
}

export function parseJson(value, label = "JSON") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`Invalid ${label} JSON.`);
  }
}

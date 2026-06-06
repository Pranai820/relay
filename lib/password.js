export function getPasswordError(password) {
  const value = String(password || "");
  const missing = [];

  if (value.length < 8) missing.push("at least 8 characters");
  if (!/[A-Z]/.test(value)) missing.push("one uppercase letter");
  if (!/[a-z]/.test(value)) missing.push("one lowercase letter");
  if (!/[0-9]/.test(value)) missing.push("one number");
  if (!/[^A-Za-z0-9]/.test(value)) missing.push("one symbol");

  if (missing.length === 0) return null;
  return `Password must contain ${missing.join(", ")}.`;
}

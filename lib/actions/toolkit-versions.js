export const TOOLKIT_VERSIONS = {
  github: "20260501_01",
  gmail: "20260506_01",
  googlecalendar: "20260429_00",
  notion: "20260512_00",
};

export const TOOLKIT_CONNECTION_KEY = {
  github: "github",
  gmail: "gmail",
  googlecalendar: "googlecalendar",
  notion: "notion",
};

export function toolkitFromSlug(toolSlug) {
  if (toolSlug.startsWith("GITHUB_")) return "github";
  if (toolSlug.startsWith("GMAIL_")) return "gmail";
  if (toolSlug.startsWith("GOOGLECALENDAR_")) return "googlecalendar";
  if (toolSlug.startsWith("NOTION_")) return "notion";
  return null;
}

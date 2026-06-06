export const COMPOSIO_BASE_URL = process.env.COMPOSIO_BASE_URL || "https://backend.composio.dev/api/v3.1";
export const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
export const GITHUB_AUTH_CONFIG_ID = process.env.GITHUB_AUTH_CONFIG_ID;
export const NOTION_AUTH_CONFIG_ID = process.env.NOTION_AUTH_CONFIG_ID;
export const GMAIL_AUTH_CONFIG_ID = process.env.GMAIL_AUTH_CONFIG_ID;
export const GOOGLECALENDAR_AUTH_CONFIG_ID = process.env.GOOGLECALENDAR_AUTH_CONFIG_ID;

export function requireServerConfig() {
  const missing = [
    ["COMPOSIO_API_KEY", COMPOSIO_API_KEY],
    ["GITHUB_AUTH_CONFIG_ID", GITHUB_AUTH_CONFIG_ID],
    ["NOTION_AUTH_CONFIG_ID", NOTION_AUTH_CONFIG_ID],
  ].filter(([, value]) => !value);

  if (missing.length) {
    throw new Error(`Missing server config: ${missing.map(([key]) => key).join(", ")}`);
  }
}

export const TOOLKIT_CONFIG = {
  github: {
    authConfigId: GITHUB_AUTH_CONFIG_ID,
    label: "GitHub",
  },
  notion: {
    authConfigId: NOTION_AUTH_CONFIG_ID,
    label: "Notion",
  },
  gmail: {
    authConfigId: GMAIL_AUTH_CONFIG_ID,
    label: "Gmail",
  },
  googlecalendar: {
    authConfigId: GOOGLECALENDAR_AUTH_CONFIG_ID,
    label: "Google Calendar",
  },
};

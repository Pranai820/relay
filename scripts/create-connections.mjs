const {
  COMPOSIO_API_KEY,
  COMPOSIO_USER_ID = `local-${crypto.randomUUID()}`,
  CALLBACK_URL = "http://localhost:3000/api/composio/callback",
  COMPOSIO_BASE_URL = "https://backend.composio.dev/api/v3.1",
  GITHUB_AUTH_CONFIG_ID,
  NOTION_AUTH_CONFIG_ID,
} = process.env;

const missing = [
  ["COMPOSIO_API_KEY", COMPOSIO_API_KEY],
  ["GITHUB_AUTH_CONFIG_ID", GITHUB_AUTH_CONFIG_ID],
  ["NOTION_AUTH_CONFIG_ID", NOTION_AUTH_CONFIG_ID],
].filter(([, value]) => !value);

if (missing.length) {
  throw new Error(`Missing env: ${missing.map(([key]) => key).join(", ")}`);
}

const baseUrl = COMPOSIO_BASE_URL;
const providers = [
  ["github", GITHUB_AUTH_CONFIG_ID],
  ["notion", NOTION_AUTH_CONFIG_ID],
];

for (const [provider, authConfigId] of providers) {
  const response = await fetch(`${baseUrl}/connected_accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": COMPOSIO_API_KEY,
    },
    body: JSON.stringify({
      auth_config: { id: authConfigId },
      connection: {
        user_id: COMPOSIO_USER_ID,
        callback_url: CALLBACK_URL,
      },
    }),
  });

  const body = await response.json().catch(() => ({}));
  console.log(JSON.stringify({ provider, status: response.status, body }, null, 2));
}

console.log(JSON.stringify({ userId: COMPOSIO_USER_ID, callbackUrl: CALLBACK_URL }, null, 2));

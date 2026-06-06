const { COMPOSIO_API_KEY, GITHUB_CONNECTED_ACCOUNT_ID, NOTION_CONNECTED_ACCOUNT_ID } = process.env;

if (!COMPOSIO_API_KEY) throw new Error("Missing COMPOSIO_API_KEY");
if (!GITHUB_CONNECTED_ACCOUNT_ID) throw new Error("Missing GITHUB_CONNECTED_ACCOUNT_ID");
if (!NOTION_CONNECTED_ACCOUNT_ID) throw new Error("Missing NOTION_CONNECTED_ACCOUNT_ID");

const baseUrl = "https://backend.composio.dev/api/v3.1";
const accounts = [
  ["github", GITHUB_CONNECTED_ACCOUNT_ID],
  ["notion", NOTION_CONNECTED_ACCOUNT_ID],
];

for (const [provider, id] of accounts) {
  const response = await fetch(`${baseUrl}/connected_accounts/${id}`, {
    method: "GET",
    headers: { "x-api-key": COMPOSIO_API_KEY },
  });
  const body = await response.json().catch(() => ({}));
  console.log(JSON.stringify({ provider, id, status: response.status, body }, null, 2));
}

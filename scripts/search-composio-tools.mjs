import { Composio } from "@composio/core";
import { OpenAIResponsesProvider } from "@composio/openai";

const {
  COMPOSIO_API_KEY,
  COMPOSIO_USER_ID,
  GITHUB_CONNECTED_ACCOUNT_ID,
  NOTION_CONNECTED_ACCOUNT_ID,
} = process.env;

if (!COMPOSIO_API_KEY) throw new Error("Missing COMPOSIO_API_KEY");
if (!COMPOSIO_USER_ID) throw new Error("Missing COMPOSIO_USER_ID");
if (!GITHUB_CONNECTED_ACCOUNT_ID) throw new Error("Missing GITHUB_CONNECTED_ACCOUNT_ID");
if (!NOTION_CONNECTED_ACCOUNT_ID) throw new Error("Missing NOTION_CONNECTED_ACCOUNT_ID");

const composio = new Composio({
  provider: new OpenAIResponsesProvider(),
  apiKey: COMPOSIO_API_KEY,
});

const session = await composio.create(COMPOSIO_USER_ID, {
  connectedAccounts: {
    github: GITHUB_CONNECTED_ACCOUNT_ID,
    notion: NOTION_CONNECTED_ACCOUNT_ID,
  },
});

const searches = [
  "list GitHub repositories for the authenticated user",
  "get GitHub repository details read only",
  "list GitHub issues in a repository read only",
  "read GitHub issue comments read only",
  "read GitHub repository file contents read only",
  "search GitHub issues read only",
  "list Notion pages",
  "search Notion pages",
  "create a Notion page for a GitHub issue",
];

const results = [];
let sessionContext = { generate_id: true };

for (let index = 0; index < searches.length; index += 6) {
  const batch = searches.slice(index, index + 6);
  const result = await session.execute("COMPOSIO_SEARCH_TOOLS", {
    queries: batch.map((useCase) => ({ use_case: useCase })),
    session: sessionContext,
    model: "gpt-5.2",
  });

  results.push({ queries: batch, result });

  const sessionId = result?.data?.session_id || result?.session_id;
  if (sessionId) {
    sessionContext = { id: sessionId };
  }
}

console.log(JSON.stringify(results, null, 2));

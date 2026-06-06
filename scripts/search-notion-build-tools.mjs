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

const result = await session.execute("COMPOSIO_SEARCH_TOOLS", {
  queries: [
    { use_case: "create a Notion page with markdown content under a parent page" },
    { use_case: "create a Notion database for tracking GitHub issues" },
    { use_case: "add markdown content blocks to an existing Notion page" },
    { use_case: "update properties of an existing Notion page" },
    { use_case: "query a Notion database and create database pages" },
  ],
  session: { generate_id: true },
  model: "gpt-5.2",
});

console.log(JSON.stringify(result, null, 2));

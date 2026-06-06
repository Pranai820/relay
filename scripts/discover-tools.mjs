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

const tools = await session.tools();

console.log(JSON.stringify({
  sessionId: session.sessionId,
  toolCount: tools.length,
  tools: tools.map((tool) => ({
    type: tool.type,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  })),
}, null, 2));

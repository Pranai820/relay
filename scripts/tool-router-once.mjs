import OpenAI from "openai";
import { Composio } from "@composio/core";
import { OpenAIResponsesProvider } from "@composio/openai";

const {
  COMPOSIO_API_KEY,
  OPENAI_API_KEY,
  COMPOSIO_USER_ID,
  GITHUB_CONNECTED_ACCOUNT_ID,
  NOTION_CONNECTED_ACCOUNT_ID,
  TOOL_ROUTER_PROMPT = "List the available GitHub and Notion capabilities you can use. Do not execute any write operation.",
  OPENAI_MODEL = "gpt-5.2",
} = process.env;

if (!COMPOSIO_API_KEY) throw new Error("Missing COMPOSIO_API_KEY");
if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
if (!COMPOSIO_USER_ID) throw new Error("Missing COMPOSIO_USER_ID");
if (!GITHUB_CONNECTED_ACCOUNT_ID) throw new Error("Missing GITHUB_CONNECTED_ACCOUNT_ID");
if (!NOTION_CONNECTED_ACCOUNT_ID) throw new Error("Missing NOTION_CONNECTED_ACCOUNT_ID");

const composio = new Composio({
  provider: new OpenAIResponsesProvider(),
  apiKey: COMPOSIO_API_KEY,
});
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const instructions = [
  "You can use the user's connected GitHub and Notion accounts through Composio tools.",
  "GitHub is strictly read-only. Never create, update, delete, comment, label, close, merge, or otherwise write to GitHub.",
  "Notion read and write operations are allowed.",
  "For this discovery run, inspect and describe capabilities only. Do not perform write operations.",
].join(" ");

const session = await composio.create(COMPOSIO_USER_ID, {
  connectedAccounts: {
    github: GITHUB_CONNECTED_ACCOUNT_ID,
    notion: NOTION_CONNECTED_ACCOUNT_ID,
  },
});

const tools = await session.tools();

let response = await client.responses.create({
  model: OPENAI_MODEL,
  instructions,
  tools,
  input: [{ role: "user", content: TOOL_ROUTER_PROMPT }],
});

while (true) {
  const toolCalls = response.output.filter((item) => item.type === "function_call");
  if (toolCalls.length === 0) break;

  const toolOutputs = await Promise.all(toolCalls.map(async (toolCall) => ({
    type: "function_call_output",
    call_id: toolCall.call_id,
    output: JSON.stringify(await session.execute(
      toolCall.name,
      toolCall.arguments ? JSON.parse(toolCall.arguments) : {},
    )),
  })));

  response = await client.responses.create({
    model: OPENAI_MODEL,
    instructions,
    tools,
    previous_response_id: response.id,
    input: toolOutputs,
  });
}

for (const item of response.output) {
  if (item.type === "message") {
    for (const content of item.content) {
      if (content.type === "output_text") {
        console.log(content.text);
      }
    }
  }
}

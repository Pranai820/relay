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

const toolSlugs = [
  "GITHUB_LIST_REPOSITORIES_FOR_THE_AUTHENTICATED_USER",
  "GITHUB_GET_A_REPOSITORY",
  "GITHUB_LIST_REPOSITORY_ISSUES",
  "GITHUB_GET_AN_ISSUE",
  "GITHUB_LIST_ISSUE_COMMENTS",
  "GITHUB_GET_REPOSITORY_CONTENT",
  "GITHUB_SEARCH_ISSUES_AND_PULL_REQUESTS",
  "NOTION_FETCH_DATA",
  "NOTION_RETRIEVE_PAGE",
  "NOTION_GET_PAGE_MARKDOWN",
  "NOTION_CREATE_NOTION_PAGE",
  "NOTION_FETCH_BLOCK_CONTENTS",
  "NOTION_QUERY_DATABASE_WITH_FILTER",
];

const result = await session.execute("COMPOSIO_GET_TOOL_SCHEMAS", {
  tool_slugs: toolSlugs,
  include: ["input_schema", "output_schema"],
});

console.log(JSON.stringify(result, null, 2));

const GITHUB_READ_TOOLS = new Set([
  "GITHUB_GET_A_REPOSITORY",
  "GITHUB_GET_AN_ISSUE",
  "GITHUB_GET_AN_ISSUE_COMMENT",
  "GITHUB_GET_A_TREE",
  "GITHUB_GET_RAW_REPOSITORY_CONTENT",
  "GITHUB_GET_REPOSITORY_CONTENT",
  "GITHUB_GET_THE_AUTHENTICATED_USER",
  "GITHUB_GET_PAGE_VIEWS",
  "GITHUB_LIST_BRANCHES",
  "GITHUB_LIST_ISSUE_COMMENTS",
  "GITHUB_LIST_ORGANIZATIONS_FOR_THE_AUTHENTICATED_USER",
  "GITHUB_LIST_PULL_REQUESTS",
  "GITHUB_LIST_REPOSITORIES_FOR_A_USER",
  "GITHUB_LIST_REPOSITORIES_FOR_THE_AUTHENTICATED_USER",
  "GITHUB_LIST_REPOSITORY_ISSUES",
  "GITHUB_LOOKUP_GITHUB_RESOURCE",
  "GITHUB_SEARCH_CODE",
  "GITHUB_SEARCH_ISSUES_AND_PULL_REQUESTS",
  "GITHUB_FIND_REPOSITORIES",
]);

export function assertAllowedTool(toolSlug) {
  if (toolSlug.startsWith("GITHUB_") && !GITHUB_READ_TOOLS.has(toolSlug)) {
    throw new Error(`Blocked GitHub write or unapproved tool: ${toolSlug}`);
  }
}

export function isAllowedTool(toolSlug) {
  try {
    assertAllowedTool(toolSlug);
    return true;
  } catch {
    return false;
  }
}

export function assertAllowedToolRouterCall(name, args) {
  if (name === "COMPOSIO_REMOTE_BASH_TOOL" || name === "COMPOSIO_REMOTE_WORKBENCH") {
    throw new Error("Remote shell/workbench execution is disabled in this app.");
  }

  if (name !== "COMPOSIO_MULTI_EXECUTE_TOOL") return;

  for (const item of args?.tools || []) {
    assertAllowedTool(item.tool_slug);
  }
}

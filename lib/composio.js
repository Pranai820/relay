import { Composio } from "@composio/core";
import { OpenAIResponsesProvider } from "@composio/openai";
import { COMPOSIO_API_KEY, requireServerConfig } from "@/lib/config";
import { TOOLKIT_VERSIONS } from "@/lib/actions/toolkit-versions";

export function createComposioClient({ withOpenAIProvider = false } = {}) {
  requireServerConfig();

  return new Composio({
    apiKey: COMPOSIO_API_KEY,
    toolkitVersions: TOOLKIT_VERSIONS,
    ...(withOpenAIProvider ? { provider: new OpenAIResponsesProvider() } : {}),
  });
}

export async function executeTool({ toolSlug, userId, connectedAccountId, args }) {
  const composio = createComposioClient();

  return composio.tools.execute(toolSlug, {
    userId,
    connectedAccountId,
    arguments: args || {},
  });
}

export function normalizeToolResult(result) {
  return result?.data ?? result;
}

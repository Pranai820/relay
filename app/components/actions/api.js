export async function runTool({ toolSlug, mode = "quick", args = {}, uploadIds = [] }) {
  const response = await fetch("/api/actions/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toolSlug, mode, args, uploadIds }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || "Action failed.");
  return data;
}

export async function runWorkflow(workflow, payload = {}) {
  const response = await fetch("/api/actions/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow, payload }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || "Workflow failed.");
  return data;
}

export async function searchNotionPages(query = "") {
  const data = await runTool({
    toolSlug: "NOTION_SEARCH_NOTION_PAGE",
    mode: "quick",
    args: { query, filter_value: "page", page_size: 25 },
  });
  const items = data.result?.results || data.result?.data?.results || data.result?.items || [];
  return items.map((item) => ({
    id: item.id,
    title: item.title?.[0]?.plain_text || item.properties?.title?.title?.[0]?.plain_text || "Untitled",
    url: item.url,
    type: item.object || "page",
  }));
}

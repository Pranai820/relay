import { executeTool, normalizeToolResult } from "@/lib/composio";
import {
  calendarWeekAheadMarkdown,
  githubRepoReportMarkdown,
  gmailInboxReportMarkdown,
} from "@/lib/actions/reports";

function unwrap(data) {
  return data?.data ?? data;
}

function listFrom(result, keys) {
  const data = unwrap(result);
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export async function runGithubRepoReport({
  userId,
  githubAccountId,
  notionAccountId,
  owner,
  repo,
  parentId,
  title,
  includeComments = true,
  issueLimit = 30,
}) {
  const [repoRaw, issuesRaw, prsRaw, viewsRaw] = await Promise.all([
    executeTool({
      toolSlug: "GITHUB_GET_A_REPOSITORY",
      userId,
      connectedAccountId: githubAccountId,
      args: { owner, repo },
    }),
    executeTool({
      toolSlug: "GITHUB_LIST_REPOSITORY_ISSUES",
      userId,
      connectedAccountId: githubAccountId,
      args: { owner, repo, state: "open", per_page: issueLimit, page: 1 },
    }),
    executeTool({
      toolSlug: "GITHUB_LIST_PULL_REQUESTS",
      userId,
      connectedAccountId: githubAccountId,
      args: { owner, repo, state: "open", per_page: 20, page: 1 },
    }),
    executeTool({
      toolSlug: "GITHUB_GET_PAGE_VIEWS",
      userId,
      connectedAccountId: githubAccountId,
      args: { owner, repo, per: "day" },
    }).catch(() => null),
  ]);

  const repository = unwrap(repoRaw);
  const issues = listFrom(issuesRaw, ["issues"]);
  const pullRequests = listFrom(prsRaw, ["pull_requests", "items"]);
  const pageViews = viewsRaw ? unwrap(viewsRaw) : null;

  const commentsByIssue = {};
  if (includeComments) {
    for (const issue of issues.slice(0, 8)) {
      const commentsRaw = await executeTool({
        toolSlug: "GITHUB_LIST_ISSUE_COMMENTS",
        userId,
        connectedAccountId: githubAccountId,
        args: { owner, repo, issue_number: issue.number, per_page: 10, page: 1 },
      });
      commentsByIssue[issue.number] = listFrom(commentsRaw, ["comments", "items"]);
    }
  }

  const markdown = githubRepoReportMarkdown({
    repo: repository,
    issues,
    pullRequests,
    commentsByIssue,
    pageViews,
  });

  const reportTitle = title || `Repo Report — ${owner}/${repo}`;
  const notionRaw = await executeTool({
    toolSlug: "NOTION_CREATE_NOTION_PAGE",
    userId,
    connectedAccountId: notionAccountId,
    args: { parent_id: parentId, title: reportTitle, markdown },
  });

  return {
    reportTitle,
    markdown,
    stats: {
      issues: issues.length,
      pullRequests: pullRequests.length,
      comments: Object.values(commentsByIssue).flat().length,
    },
    notion: normalizeToolResult(notionRaw),
  };
}

export async function runGmailInboxDigest({
  userId,
  gmailAccountId,
  notionAccountId,
  parentId,
  title,
  query = "is:unread in:inbox",
  maxResults = 30,
}) {
  const emailsRaw = await executeTool({
    toolSlug: "GMAIL_FETCH_EMAILS",
    userId,
    connectedAccountId: gmailAccountId,
    args: {
      user_id: "me",
      query,
      max_results: maxResults,
      verbose: true,
      include_payload: true,
    },
  });

  const data = unwrap(emailsRaw);
  const emails = listFrom(emailsRaw, ["messages", "emails", "items"]).map((m) => ({
    ...m,
    from: m.from || m.sender || m.payload?.headers?.find?.((h) => h.name === "From")?.value,
    subject: m.subject || m.payload?.headers?.find?.((h) => h.name === "Subject")?.value,
    snippet: m.snippet || m.preview,
    date: m.date || m.internalDate,
    labelIds: m.labelIds || [],
  }));

  const markdown = gmailInboxReportMarkdown({ emails });
  const reportTitle = title || `Inbox Digest — ${new Date().toLocaleDateString()}`;

  const notionRaw = await executeTool({
    toolSlug: "NOTION_CREATE_NOTION_PAGE",
    userId,
    connectedAccountId: notionAccountId,
    args: { parent_id: parentId, title: reportTitle, markdown },
  });

  return {
    reportTitle,
    markdown,
    stats: { total: emails.length, unread: emails.filter((e) => e.labelIds?.includes("UNREAD")).length },
    emails,
    notion: normalizeToolResult(notionRaw),
  };
}

export async function runCalendarWeekAhead({
  userId,
  calendarAccountId,
  notionAccountId,
  parentId,
  title,
  timezone,
  days = 7,
}) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);

  const offset = timezone ? getOffsetForTimezone(now, timezone) : formatOffset(now);
  const timeMin = toRfc3339(now, offset);
  const timeMax = toRfc3339(end, offset);

  const eventsRaw = await executeTool({
    toolSlug: "GOOGLECALENDAR_EVENTS_LIST",
    userId,
    connectedAccountId: calendarAccountId,
    args: {
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
      timeZone: timezone || undefined,
    },
  });

  const events = listFrom(eventsRaw, ["items", "events"]);
  const markdown = calendarWeekAheadMarkdown({ events, timezone });
  const reportTitle = title || `Week Ahead — ${now.toLocaleDateString()}`;

  const notionRaw = await executeTool({
    toolSlug: "NOTION_CREATE_NOTION_PAGE",
    userId,
    connectedAccountId: notionAccountId,
    args: { parent_id: parentId, title: reportTitle, markdown },
  });

  return {
    reportTitle,
    markdown,
    stats: { events: events.length },
    events,
    notion: normalizeToolResult(notionRaw),
  };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatOffset(date) {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function getOffsetForTimezone(date, tz) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date);
    const name = parts.find((p) => p.type === "timeZoneName")?.value || "";
    const m = name.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
    if (m) return `${m[1].includes(":") ? m[1] : `${m[1]}:00`}`.replace(/([+-])(\d):/, "$10$2:");
  } catch {
    // fall through
  }
  return formatOffset(date);
}

function toRfc3339(date, offset) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  const iso = local.toISOString().slice(0, 19);
  return `${iso}${offset}`;
}

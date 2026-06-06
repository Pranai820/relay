function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function trim(text, max = 200) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function githubRepoReportMarkdown({
  repo,
  issues = [],
  pullRequests = [],
  commentsByIssue = {},
  pageViews = null,
  generatedAt = new Date().toISOString(),
}) {
  const fullName = repo?.full_name || repo?.name || "Repository";
  const issueRows = issues.slice(0, 30).map((issue) => {
    const labels = (issue.labels || []).map((l) => l.name || l).filter(Boolean).join(", ") || "—";
    return `| #${issue.number} | ${trim(issue.title, 80)} | ${issue.state || "—"} | ${issue.user?.login || "—"} | ${issue.comments || 0} | ${labels} |`;
  }).join("\n");

  const prRows = pullRequests.slice(0, 20).map((pr) => (
    `| #${pr.number} | ${trim(pr.title, 80)} | ${pr.state || "—"} | ${pr.user?.login || "—"} | ${pr.head?.ref || "—"} → ${pr.base?.ref || "—"} |`
  )).join("\n");

  const commentSections = issues.slice(0, 8).map((issue) => {
    const comments = commentsByIssue[issue.number] || [];
    if (!comments.length) return "";
    const lines = comments.slice(0, 5).map((c) => `> **${c.user?.login || "user"}** (${fmtDate(c.created_at)}): ${trim(c.body, 300)}`).join("\n>\n");
    return `### Issue #${issue.number} — recent comments\n\n${lines}\n`;
  }).filter(Boolean).join("\n");

  const viewsSection = pageViews?.views?.length
    ? `## Traffic (last 14 days)\n\n| Date | Views | Uniques |\n| --- | ---: | ---: |\n${pageViews.views.map((v) => `| ${v.timestamp?.slice(0, 10) || "—"} | ${v.count || 0} | ${v.uniques || 0} |`).join("\n")}\n`
    : "";

  return [
    `# Repository Report — ${fullName}`,
    "",
    `> Generated ${fmtDate(generatedAt)}`,
    "",
    "## Overview",
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| Description | ${trim(repo?.description, 120) || "—"} |`,
    `| Language | ${repo?.language || "—"} |`,
    `| Stars | ${repo?.stargazers_count ?? "—"} |`,
    `| Open issues | ${repo?.open_issues_count ?? "—"} |`,
    `| Default branch | ${repo?.default_branch || "—"} |`,
    `| Updated | ${fmtDate(repo?.updated_at)} |`,
    `| URL | ${repo?.html_url || "—"} |`,
    "",
    viewsSection,
    "## Open issues",
    "",
    issueRows.length
      ? `| # | Title | State | Author | Comments | Labels |\n| --- | --- | --- | --- | ---: | --- |\n${issueRows}`
      : "_No issues found._",
    "",
    "## Open pull requests",
    "",
    prRows.length
      ? `| # | Title | State | Author | Branches |\n| --- | --- | --- | --- | --- |\n${prRows}`
      : "_No pull requests found._",
    "",
    commentSections ? "## Discussion highlights\n\n" + commentSections : "",
    "## Summary",
    "",
    `- **${issues.length}** issues captured`,
    `- **${pullRequests.length}** pull requests captured`,
    `- **${Object.values(commentsByIssue).flat().length}** comments sampled`,
  ].filter(Boolean).join("\n");
}

export function gmailInboxReportMarkdown({ emails = [], generatedAt = new Date().toISOString() }) {
  const unread = emails.filter((e) => e.labelIds?.includes("UNREAD")).length;
  const withAttach = emails.filter((e) => e.hasAttachment || e.attachments?.length).length;
  const senders = {};
  for (const e of emails) {
    const from = e.from || e.sender || "Unknown";
    senders[from] = (senders[from] || 0) + 1;
  }
  const topSenders = Object.entries(senders).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const rows = emails.slice(0, 50).map((e) => {
    const unreadMark = e.labelIds?.includes("UNREAD") ? "🔵" : "";
    const attach = e.hasAttachment || e.attachments?.length ? "📎" : "";
    return `| ${unreadMark} | ${trim(e.from || e.sender, 40)} | ${trim(e.subject, 60)} | ${fmtDate(e.date || e.internalDate)} | ${attach} | ${trim(e.snippet || e.preview, 80)} |`;
  }).join("\n");

  return [
    "# Inbox Digest",
    "",
    `> Generated ${fmtDate(generatedAt)}`,
    "",
    "## Stats",
    "",
    `| Metric | Count |`,
    `| --- | ---: |`,
    `| Total emails | ${emails.length} |`,
    `| Unread | ${unread} |`,
    `| With attachments | ${withAttach} |`,
    "",
    topSenders.length ? "## Top senders\n\n" + topSenders.map(([s, c]) => `- **${s}** — ${c} email(s)`).join("\n") : "",
    "",
    "## Messages",
    "",
    rows.length
      ? `|  | From | Subject | Date |  | Preview |\n| --- | --- | --- | --- | --- | --- |\n${rows}`
      : "_No emails found._",
  ].filter(Boolean).join("\n");
}

export function calendarWeekAheadMarkdown({ events = [], timezone, generatedAt = new Date().toISOString() }) {
  const byDay = {};
  for (const ev of events) {
    const start = ev.start?.dateTime || ev.start?.date || "";
    const day = start.slice(0, 10) || "Unknown";
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(ev);
  }

  const sections = Object.keys(byDay).sort().map((day) => {
    const rows = byDay[day].map((ev) => {
      const start = ev.start?.dateTime || ev.start?.date || "";
      const end = ev.end?.dateTime || ev.end?.date || "";
      const time = ev.start?.date ? "All day" : `${start.slice(11, 16)} – ${end.slice(11, 16)}`;
      const loc = ev.location ? `📍 ${trim(ev.location, 40)}` : "";
      const attendees = ev.attendees?.length ? `👥 ${ev.attendees.length}` : "";
      return `- **${time}** — ${ev.summary || "(No title)"} ${loc} ${attendees}`.trim();
    }).join("\n");
    return `### ${day}\n\n${rows}`;
  }).join("\n\n");

  return [
    "# Week Ahead — Calendar Agenda",
    "",
    `> Generated ${fmtDate(generatedAt)}${timezone ? ` · ${timezone}` : ""}`,
    "",
    `**${events.length}** events in the next 7 days`,
    "",
    sections || "_No upcoming events._",
  ].join("\n");
}

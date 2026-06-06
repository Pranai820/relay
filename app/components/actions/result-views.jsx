"use client";

import { ExternalLink } from "lucide-react";
import { isEventMine } from "@/lib/calendar-ownership";
import { EmptyState, ResultShell, StatTiles } from "./shared";

export { isEventMine };

function fmtDate(v) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString(); } catch { return String(v); }
}

function listItems(result, keys) {
  for (const key of keys) {
    if (Array.isArray(result?.[key])) return result[key];
  }
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

export function GenericResult({ data }) {
  return <pre className="result-raw">{JSON.stringify(data, null, 2)}</pre>;
}

export function WorkflowResult({ data }) {
  const url = data?.notion?.url || data?.notion?.data?.url;
  return (
    <ResultShell
      title={data.reportTitle || "Report created"}
      subtitle={data.stats ? Object.entries(data.stats).map(([k, v]) => `${v} ${k}`).join(" · ") : ""}
      actions={url ? <a className="btn primary" href={url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open in Notion</a> : null}
    >
      {data.markdown && <div className="markdown-preview">{data.markdown.slice(0, 1200)}{data.markdown.length > 1200 ? "…" : ""}</div>}
    </ResultShell>
  );
}

export function GitHubReposResult({ data }) {
  const repos = listItems(data, ["repositories", "items"]);
  if (!repos.length) return <EmptyState message="No repositories found." />;
  return (
    <ResultShell title={`${repos.length} repositories`}>
      <div className="card-grid">
        {repos.map((repo) => (
          <a key={repo.id || repo.full_name} className="repo-card" href={repo.html_url} target="_blank" rel="noreferrer">
            <div className="repo-card-top">
              <strong>{repo.full_name || repo.name}</strong>
              <span className={`badge ${repo.private ? "private" : "public"}`}>{repo.private ? "Private" : "Public"}</span>
            </div>
            <p>{repo.description || "No description"}</p>
            <div className="repo-meta">
              {repo.language && <span>{repo.language}</span>}
              <span>⭐ {repo.stargazers_count ?? 0}</span>
              <span>Updated {fmtDate(repo.updated_at)}</span>
            </div>
          </a>
        ))}
      </div>
    </ResultShell>
  );
}

export function GitHubIssuesResult({ data, type = "issue" }) {
  const items = listItems(data, ["issues", "items", "pull_requests"]);
  if (!items.length) return <EmptyState message={`No ${type}s found.`} />;
  return (
    <ResultShell title={`${items.length} ${type}s`}>
      <div className="list-rows">
        {items.map((item) => (
          <a key={item.id || item.number} className="list-row" href={item.html_url} target="_blank" rel="noreferrer">
            <span className="row-num">#{item.number}</span>
            <div className="row-main">
              <strong>{item.title}</strong>
              <span className="row-meta">{item.user?.login || "—"} · {fmtDate(item.updated_at)} · 💬 {item.comments ?? 0}</span>
              <div className="chip-row">
                <span className={`chip state-${item.state}`}>{item.state}</span>
                {(item.labels || []).slice(0, 4).map((l) => (
                  <span key={l.name || l} className="chip">{l.name || l}</span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
    </ResultShell>
  );
}

export function GitHubViewsResult({ data }) {
  const views = data?.views || [];
  const total = views.reduce((s, v) => s + (v.count || 0), 0);
  const uniques = views.reduce((s, v) => s + (v.uniques || 0), 0);
  const max = Math.max(...views.map((v) => v.count || 0), 1);
  return (
    <ResultShell title="Repository traffic">
      <StatTiles items={[{ label: "Total views", value: total }, { label: "Unique visitors", value: uniques }]} />
      <div className="bar-chart">
        {views.map((v) => (
          <div key={v.timestamp} className="bar-item">
            <div className="bar" style={{ height: `${((v.count || 0) / max) * 100}%` }} />
            <span>{(v.timestamp || "").slice(5, 10)}</span>
          </div>
        ))}
      </div>
    </ResultShell>
  );
}

function headerValue(message, name) {
  const headers = message?.payload?.headers || message?.headers;
  if (!Array.isArray(headers)) return "";
  return headers.find((h) => h?.name?.toLowerCase() === name.toLowerCase())?.value || "";
}

function asEmailText(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.subject || value.body || value.text || value.snippet || value.preview || "";
  }
  return String(value);
}

function normalizeGmailMessage(message) {
  const subject = asEmailText(message.subject) || headerValue(message, "Subject");
  const snippet = asEmailText(message.snippet || message.preview || message.body)
    || asEmailText(message.messageText)
    || "";
  const from = asEmailText(message.from || message.sender) || headerValue(message, "From");
  return {
    id: message.id || message.messageId || message.message_id,
    threadId: message.threadId || message.thread_id,
    from,
    fromEmail: String(from).match(/<([^>]+)>/)?.[1] || from,
    subject,
    snippet,
    date: message.date || message.internalDate || message.received_at,
    unread: message.labelIds?.includes("UNREAD"),
  };
}

export function GmailEmailsResult({ data, onReply }) {
  const emails = listItems(data, ["messages", "emails", "items"]).map(normalizeGmailMessage);
  if (!emails.length) return <EmptyState message="No emails found." />;
  return (
    <ResultShell title={`${emails.length} emails`}>
      <div className="email-list">
        {emails.map((email, index) => (
          <div key={email.id || `${email.threadId || "email"}-${index}`} className={`email-row ${email.unread ? "unread" : ""}`}>
            <div className="email-main">
              <strong>{email.from || "Unknown"}</strong>
              <span className="email-subject">{email.subject || "(No subject)"}</span>
              <span className="email-snippet">{email.snippet}</span>
            </div>
            <div className="email-side">
              <span>{fmtDate(email.date)}</span>
              {onReply && email.threadId && (
                <button type="button" className="btn sm" onClick={() => onReply(email)}>Reply</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ResultShell>
  );
}

export function GmailSuccessResult({ data, label }) {
  return (
    <ResultShell title={label || "Done"}>
      <div className="success-card">
        <span className="success-icon">✅</span>
        <p>{data.message || "Completed successfully."}</p>
        {data.id && <span className="muted">ID: {data.id}</span>}
      </div>
    </ResultShell>
  );
}

export function CalendarEventsResult({ data, userEmail, onEdit, onDelete, mineOnly = false }) {
  const events = listItems(data, ["items", "events"]);
  const filtered = mineOnly ? events.filter((e) => isEventMine(e, userEmail)) : events;
  if (!filtered.length) return <EmptyState message={mineOnly ? "No events you created." : "No events found."} />;

  const byDay = {};
  for (const ev of filtered) {
    const day = (ev.start?.dateTime || ev.start?.date || "").slice(0, 10) || "Unknown";
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(ev);
  }

  return (
    <ResultShell title={`${filtered.length} events`}>
      {Object.keys(byDay).sort().map((day) => (
        <div key={day} className="agenda-day">
          <h4>{day}</h4>
          {byDay[day].map((ev) => {
            const mine = isEventMine(ev, userEmail);
            const time = ev.start?.date ? "All day" : `${(ev.start?.dateTime || "").slice(11, 16)}`;
            return (
              <div key={ev.id} className="event-row">
                <div className="event-time">{time}</div>
                <div className="event-main">
                  <strong>{ev.summary || "(No title)"}</strong>
                  {ev.location && <span className="muted">📍 {ev.location}</span>}
                  {mine && <span className="chip ok">Created by you</span>}
                  {!mine && ev.organizer?.email && <span className="muted">Organizer: {ev.organizer.email}</span>}
                </div>
                <div className="event-actions">
                  {mine && onEdit && <button type="button" className="btn sm" onClick={() => onEdit(ev)}>Edit</button>}
                  {mine && onDelete && <button type="button" className="btn sm danger" onClick={() => onDelete(ev)}>Delete</button>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </ResultShell>
  );
}

export function NotionSearchResult({ data }) {
  const items = listItems(data, ["results", "items"]);
  if (!items.length) return <EmptyState message="Nothing found." />;
  return (
    <ResultShell title={`${items.length} results`}>
      <div className="notion-grid">
        {items.map((item) => (
          <a key={item.id} className="notion-card" href={item.url} target="_blank" rel="noreferrer">
            <span className={`badge ${item.object}`}>{item.object}</span>
            <strong>{item.title?.[0]?.plain_text || item.properties?.title?.title?.[0]?.plain_text || "Untitled"}</strong>
            <span className="muted">Edited {fmtDate(item.last_edited_time)}</span>
          </a>
        ))}
      </div>
    </ResultShell>
  );
}

export function NotionTableResult({ data }) {
  const rows = listItems(data, ["results", "items"]);
  if (!rows.length) return <EmptyState message="No rows in this database." />;
  return (
    <ResultShell title={`${rows.length} rows`}>
      <div className="list-rows">
        {rows.map((row) => {
          const title = row.properties?.title?.title?.[0]?.plain_text
            || row.properties?.Name?.title?.[0]?.plain_text
            || "Untitled row";
          return (
            <div key={row.id} className="list-row static">
              <div className="row-main">
                <strong>{title}</strong>
                <span className="row-meta">ID: {row.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </ResultShell>
  );
}

export function renderActionResult({ response, userEmail, handlers = {} }) {
  if (!response) return null;
  if (response.kind === "workflow") return <WorkflowResult data={response.result} />;

  const { toolSlug, result } = response;
  if (toolSlug === "GITHUB_LIST_REPOSITORIES_FOR_THE_AUTHENTICATED_USER") return <GitHubReposResult data={result} />;
  if (toolSlug === "GITHUB_SEARCH_ISSUES_AND_PULL_REQUESTS" || toolSlug === "GITHUB_LIST_REPOSITORY_ISSUES") {
    return <GitHubIssuesResult data={result} type="issue" />;
  }
  if (toolSlug === "GITHUB_LIST_PULL_REQUESTS") return <GitHubIssuesResult data={result} type="pull request" />;
  if (toolSlug === "GITHUB_GET_PAGE_VIEWS") return <GitHubViewsResult data={result} />;
  if (toolSlug === "GMAIL_FETCH_EMAILS") return <GmailEmailsResult data={result} onReply={handlers.onReply} />;
  if (toolSlug.startsWith("GMAIL_SEND") || toolSlug.startsWith("GMAIL_CREATE") || toolSlug.startsWith("GMAIL_REPLY")) {
    return <GmailSuccessResult data={result} label="Email action completed" />;
  }
  if (toolSlug.startsWith("GOOGLECALENDAR_EVENTS") || toolSlug === "GOOGLECALENDAR_FIND_EVENT") {
    return (
      <CalendarEventsResult
        data={result}
        userEmail={userEmail}
        mineOnly={handlers.mineOnly}
        onEdit={handlers.onEdit}
        onDelete={handlers.onDelete}
      />
    );
  }
  if (toolSlug === "NOTION_SEARCH_NOTION_PAGE" || toolSlug === "NOTION_FETCH_DATA") return <NotionSearchResult data={result} />;
  if (toolSlug === "NOTION_QUERY_DATABASE" || toolSlug === "NOTION_QUERY_DATABASE_WITH_FILTER") return <NotionTableResult data={result} />;
  if (toolSlug === "NOTION_CREATE_NOTION_PAGE") {
    const url = result?.url || result?.data?.url;
    return (
      <ResultShell title="Page created" actions={url ? <a className="btn primary" href={url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open</a> : null}>
        <p>Your Notion page was created successfully.</p>
      </ResultShell>
    );
  }
  return <GenericResult data={result} />;
}

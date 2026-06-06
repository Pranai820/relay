"use client";

import { useState } from "react";
import { runTool } from "./api";
import CalendarPanel from "./calendar-panel";
import GitHubPanel from "./github-panel";
import GmailPanel from "./gmail-panel";
import NotionPanel from "./notion-panel";
import { renderActionResult } from "./result-views";
import { ToolkitTabs } from "./shared";

const TABS = [
  { id: "github", label: "GitHub", logo: "/github.png" },
  { id: "gmail", label: "Gmail", logo: "/gmail.png" },
  { id: "googlecalendar", label: "Calendar", logo: "/googlecalendar.png" },
  { id: "notion", label: "Notion", logo: "/notion.png" },
];

export default function ActionsPanel({ connectionStatus, userEmail }) {
  const [toolkit, setToolkit] = useState("github");
  const [loadingKey, setLoadingKey] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [replyContext, setReplyContext] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [calendarMineOnly, setCalendarMineOnly] = useState(false);

  const connected = (key) => connectionStatus[key] === "ACTIVE";

  function handleResult(data) {
    if (data?.error) {
      setError(data.error);
      setResponse(null);
      return;
    }
    setError("");
    setResponse(data);
  }

  async function handleDeleteEvent(event) {
    if (!confirm(`Delete "${event.summary}"?`)) return;
    setLoadingKey("cal-delete");
    try {
      const data = await runTool({
        toolSlug: "GOOGLECALENDAR_DELETE_EVENT",
        mode: "custom",
        args: { calendar_id: "primary", event_id: event.id, send_updates: "all" },
      });
      handleResult(data);
    } catch (e) {
      handleResult({ error: e.message });
    } finally {
      setLoadingKey("");
    }
  }

  const handlers = {
    onReply: (email) => {
      const fromEmail = String(email.from || "").match(/<([^>]+)>/)?.[1] || email.from;
      setReplyContext({ ...email, fromEmail });
      setToolkit("gmail");
    },
    onEdit: (event) => {
      setEditEvent(event);
      setToolkit("googlecalendar");
    },
    onDelete: handleDeleteEvent,
    mineOnly: calendarMineOnly,
  };

  const tabs = TABS.map((t) => ({ ...t, connected: connected(t.id) }));

  return (
    <div className="actions-layout">
      <section className="section actions-main">
        <div className="section-head">
          <div>
            <h3 className="section-title">Quick Actions</h3>
            <p className="section-copy">Pick a toolkit, run Quick actions with minimal input, or switch to Custom for full control.</p>
          </div>
        </div>
        <div className="section-body stack">
          <ToolkitTabs tabs={tabs} active={toolkit} onChange={setToolkit} />
          {toolkit === "github" && (
            <GitHubPanel
              connected={connected("github")}
              notionConnected={connected("notion")}
              onResult={handleResult}
              loadingKey={loadingKey}
              setLoadingKey={setLoadingKey}
            />
          )}
          {toolkit === "gmail" && (
            <GmailPanel
              connected={connected("gmail")}
              notionConnected={connected("notion")}
              userEmail={userEmail}
              onResult={handleResult}
              loadingKey={loadingKey}
              setLoadingKey={setLoadingKey}
              replyContext={replyContext}
              clearReply={() => setReplyContext(null)}
            />
          )}
          {toolkit === "googlecalendar" && (
            <CalendarPanel
              connected={connected("googlecalendar")}
              notionConnected={connected("notion")}
              userEmail={userEmail}
              onResult={handleResult}
              loadingKey={loadingKey}
              setLoadingKey={setLoadingKey}
              editEvent={editEvent}
              setEditEvent={setEditEvent}
            />
          )}
          {toolkit === "notion" && (
            <NotionPanel
              connected={connected("notion")}
              onResult={handleResult}
              loadingKey={loadingKey}
              setLoadingKey={setLoadingKey}
            />
          )}
        </div>
      </section>

      <section className="section actions-result">
        <div className="section-head">
          <div>
            <h3 className="section-title">Results</h3>
            <p className="section-copy">Formatted output from your last action.</p>
          </div>
          {response?.toolSlug?.startsWith("GOOGLECALENDAR_") && (
            <label className="inline-check">
              <input type="checkbox" checked={calendarMineOnly} onChange={(e) => setCalendarMineOnly(e.target.checked)} />
              Show only events I created
            </label>
          )}
        </div>
        <div className="section-body">
          {error && <div className="result-error">{error}</div>}
          {!error && !response && <p className="empty-state">Run an action to see results here.</p>}
          {!error && response && renderActionResult({ response, userEmail, handlers })}
        </div>
      </section>
    </div>
  );
}

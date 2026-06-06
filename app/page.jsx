"use client";

import ActionsPanel from "@/app/components/actions/ActionsPanel";
import FileUploadField from "@/app/components/actions/file-upload";
import TemplatesPanel from "@/app/components/templates/TemplatesPanel";
import {
  Bot,
  CheckCircle2,
  KeyRound,
  ListChecks,
  Loader2,
  LogOut,
  NotebookTabs,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";

const STORAGE_KEYS = {
  openaiKey: "gna:openaiKey",
  openaiModel: "gna:openaiModel",
};

export default function Home() {
  const { data: session } = useSession();
  const [active, setActive] = useState("actions");
  const [connections, setConnections] = useState({});
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatFiles, setChatFiles] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Connect GitHub, Notion, Gmail, or Google Calendar, save your OpenAI key for this browser session, then ask me to read GitHub, build Notion pages, draft emails, or schedule calendar events. Attach files in chat and I'll include them when sending or drafting Gmail messages.",
    },
  ]);
  const [previousResponseId, setPreviousResponseId] = useState("");

  const userId = session?.user?.id || "";
  const userEmail = session?.user?.email || "";
  const githubAccountId = connections.github?.id || "";
  const notionAccountId = connections.notion?.id || "";
  const gmailAccountId = connections.gmail?.id || "";
  const calendarAccountId = connections.googlecalendar?.id || "";
  const connectionStatus = {
    github: connections.github?.status || "unknown",
    notion: connections.notion?.status || "unknown",
    gmail: connections.gmail?.status || "unknown",
    googlecalendar: connections.googlecalendar?.status || "unknown",
  };
  const hasAnyConnection = Boolean(githubAccountId || notionAccountId || gmailAccountId || calendarAccountId);
  const connectionReady = Object.values(connectionStatus).some((status) => status === "ACTIVE");

  const connectables = [
    { toolkit: "github", label: "GitHub", logo: "/github.png" },
    { toolkit: "notion", label: "Notion", logo: "/notion.png" },
    { toolkit: "gmail", label: "Gmail", logo: "/gmail.png" },
    { toolkit: "googlecalendar", label: "Google Calendar", logo: "/googlecalendar.png" },
  ];

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/composio/callback`;
  }, []);

  useEffect(() => {
    setOpenaiKey(sessionStorage.getItem(STORAGE_KEYS.openaiKey) || "");
    setOpenaiModel(sessionStorage.getItem(STORAGE_KEYS.openaiModel) || "gpt-5.2");
    loadConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") !== "true") return;

    const appName = (params.get("appName") || "").toLowerCase();
    setActive("connections");
    setOutput(`Returned from OAuth for ${appName || "account"}. Verifying connection status...`);
    window.history.replaceState({}, "", window.location.pathname);
    checkConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.href = "/signin";
  }

  async function loadConnections() {
    try {
      const response = await fetch("/api/connections/list");
      if (!response.ok) return;
      const data = await response.json();
      setConnections(data.connections || {});
    } catch {
      // ignore; user can refresh manually
    }
  }

  async function createConnection(toolkit) {
    setLoading(`connect-${toolkit}`);
    try {
      const response = await fetch("/api/connections/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit, callbackUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Connection failed.");

      setConnections((current) => ({
        ...current,
        [toolkit]: { id: data.id, status: data.status || "INITIATED" },
      }));

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setOutput(JSON.stringify({ toolkit, connectedAccountId: data.id, redirectUrl: data.redirectUrl }, null, 2));
    } catch (error) {
      setOutput(error.message);
    } finally {
      setLoading("");
    }
  }

  async function clearConnections() {
    setLoading("disconnect");
    try {
      const response = await fetch("/api/connections/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Disconnect failed.");

      setConnections({});
      setOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      setOutput(`Disconnect error: ${error.message}`);
    } finally {
      setLoading("");
    }
  }

  async function checkConnections() {
    setLoading("status");
    try {
      await loadConnections();
      const response = await fetch("/api/connections/status", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Status check failed.");

      setConnections((current) => {
        const next = { ...current };
        for (const [toolkit, status] of Object.entries(data)) {
          next[toolkit] = { ...(next[toolkit] || {}), status };
        }
        return next;
      });
      setOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      setOutput(error.message);
    } finally {
      setLoading("");
    }
  }

  function saveOpenAiKey() {
    sessionStorage.setItem(STORAGE_KEYS.openaiKey, openaiKey);
    sessionStorage.setItem(STORAGE_KEYS.openaiModel, openaiModel);
    setOutput("OpenAI API key and model saved in this browser session only. They will be cleared when the session ends or you remove them.");
  }

  function clearOpenAiKey() {
    sessionStorage.removeItem(STORAGE_KEYS.openaiKey);
    sessionStorage.removeItem(STORAGE_KEYS.openaiModel);
    setOpenaiKey("");
    setOpenaiModel("gpt-5.2");
    setPreviousResponseId("");
    setOutput("OpenAI API key and model cleared from browser session.");
  }

  async function sendChat() {
    if (!chatInput.trim() && !chatFiles.length) return;
    const userMessage = chatInput.trim();
    const attachments = chatFiles.map((file) => file.name);
    const key = sessionStorage.getItem(STORAGE_KEYS.openaiKey);
    const model = sessionStorage.getItem(STORAGE_KEYS.openaiModel);
    const uploadIds = chatFiles.map((file) => file.id);
    setChatInput("");
    setChatFiles([]);
    setChatMessages((messages) => [...messages, {
      role: "user",
      content: userMessage || "(attached file(s) only)",
      attachments,
    }]);
    setLoading("chat");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openaiApiKey: key,
          model,
          message: userMessage,
          previousResponseId,
          uploadIds,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat failed.");
      setPreviousResponseId(data.responseId);
      setChatMessages((messages) => [...messages, { role: "assistant", content: data.text || "Done." }]);
    } catch (error) {
      setChatMessages((messages) => [...messages, { role: "assistant", content: `Error: ${error.message}` }]);
    } finally {
      setLoading("");
    }
  }

  const nav = [
    ["actions", ListChecks, "Quick Actions"],
    ["connections", ShieldCheck, "Connections"],
    ["assistant", Bot, "AI Assistant"],
    ["templates", NotebookTabs, "Templates"],
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">RL</div>
          <div>
            <h1 className="brand-title">Relay</h1>
            <p className="brand-subtitle">Actions, AI, and reports across your apps.</p>
          </div>
        </div>

        <nav className="nav-list">
          {nav.map(([id, Icon, label]) => (
            <button key={id} className={`nav-button ${active === id ? "active" : ""}`} onClick={() => setActive(id)}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="side-note">
          GitHub is read-only. Notion, Gmail, and Google Calendar support read and write so the assistant can draft emails, schedule events, and build workspace pages.
        </div>

        {userEmail && (
          <div className="user-box">
            <div className="user-meta">
              <span className="user-label">Signed in as</span>
              <span className="user-email">{userEmail}</span>
            </div>
            <button className="btn ghost" onClick={handleSignOut}>
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}
      </aside>

      <section className="main">
        <div className="topbar">
          <div>
            <h2 className="page-title">{pageTitle(active)}</h2>
            <p className="page-copy">{pageCopy(active)}</p>
          </div>
          <div className="status-row">
            <StatusPill label="GitHub" status={connectionStatus.github} hasId={Boolean(githubAccountId)} />
            <StatusPill label="Notion" status={connectionStatus.notion} hasId={Boolean(notionAccountId)} />
            <StatusPill label="Gmail" status={connectionStatus.gmail} hasId={Boolean(gmailAccountId)} />
            <StatusPill label="Calendar" status={connectionStatus.googlecalendar} hasId={Boolean(calendarAccountId)} />
            <span className={`pill ${openaiKey ? "ok" : "warn"}`}>
              <KeyRound size={14} />
              {openaiKey ? "OpenAI key in session" : "No OpenAI key"}
            </span>
          </div>
        </div>

        {active === "actions" && (
          <ActionsPanel connectionStatus={connectionStatus} userEmail={userEmail} />
        )}

        {active === "connections" && (
          <div className="grid">
            <section className="section">
              <div className="section-head">
                <div>
                  <h3 className="section-title">Composio Connections</h3>
                  <p className="section-copy">Connect GitHub, Notion, Gmail, and Google Calendar. Connections are stored per account; use ngrok or Vercel as the callback origin when authorizing OAuth.</p>
                </div>
              </div>
              <div className="section-body stack">
                <div className="form-grid">
                  <TextField label="User ID" value={userId} readOnly span />
                  <TextField label="Callback URL" value={callbackUrl} readOnly span />
                  {connectables.map(({ toolkit, label }) => (
                    <TextField
                      key={toolkit}
                      label={`${label} connected account ID`}
                      value={connections[toolkit]?.id || ""}
                      readOnly
                    />
                  ))}
                </div>
                <div className="button-row">
                  {connectables.map(({ toolkit, label, logo }) => (
                    <ConnectButton
                      key={toolkit}
                      label={label}
                      logo={logo}
                      active={connectionStatus[toolkit] === "ACTIVE"}
                      loading={loading === `connect-${toolkit}`}
                      disabled={!userId}
                      onConnect={() => createConnection(toolkit)}
                    />
                  ))}
                  <button className="btn" onClick={checkConnections} disabled={loading === "status" || !hasAnyConnection}>
                    {loading === "status" ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                    Check Status
                  </button>
                  <button className="btn danger" onClick={clearConnections} disabled={loading === "disconnect" || !hasAnyConnection}>
                    {loading === "disconnect" ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                    Disconnect
                  </button>
                </div>
              </div>
            </section>
            <OutputPanel output={output} />
          </div>
        )}

        {active === "assistant" && (
          <div className="grid">
            <section className="section">
              <div className="section-head">
                <div>
                  <h3 className="section-title">AI Assistant</h3>
                  <p className="section-copy">Chat across GitHub, Notion, Gmail, and Calendar using a browser-session OpenAI key. Attach files in chat and they&apos;ll be included when the assistant sends or drafts email.</p>
                </div>
              </div>
              <div className="section-body stack">
                <div className="form-grid">
                  <TextField label="OpenAI API key" value={openaiKey} onChange={setOpenaiKey} type="password" span />
                  <TextField label="OpenAI model" value={openaiModel} onChange={setOpenaiModel} span />
                </div>
                <div className="button-row">
                  <button className="btn primary" onClick={saveOpenAiKey}>
                    <KeyRound size={16} />
                    Save For Session
                  </button>
                  <button className="btn danger" onClick={clearOpenAiKey}>Clear Key</button>
                </div>
                <div className="chat-log">
                  {chatMessages.map((message, index) => (
                    <div key={index} className={`message ${message.role}`}>
                      <div>{message.content}</div>
                      {message.attachments?.length > 0 && (
                        <ul className="message-attachments">
                          {message.attachments.map((name) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                <div className="chat-compose">
                  <div className="field">
                    <label className="label" htmlFor="chat-input">Message</label>
                    <textarea
                      id="chat-input"
                      className="textarea"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Example: Email the attached report to alex@example.com with a short summary."
                    />
                  </div>
                  <FileUploadField files={chatFiles} onChange={setChatFiles} label="Attachments (optional)" />
                </div>
                <button className="btn primary" onClick={sendChat} disabled={!connectionReady || !openaiKey || loading === "chat" || (!chatInput.trim() && !chatFiles.length)}>
                  {loading === "chat" ? <Loader2 size={16} /> : <Send size={16} />}
                  Send
                </button>
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <h3 className="section-title">Guardrails</h3>
                  <p className="section-copy">The backend blocks GitHub writes even if the model tries one.</p>
                </div>
              </div>
              <div className="section-body list">
                <MiniCard title="GitHub (read-only)" copy="Read repositories, issues, comments, trees, and file contents. Writes are blocked." />
                <MiniCard title="Notion" copy="Create pages, reports, and task notes from connected-app context." />
                <MiniCard title="Gmail" copy="Read, search, draft, and send email — attach files in chat for automatic inclusion." />
                <MiniCard title="Google Calendar" copy="Read availability and create, update, or delete events." />
                <MiniCard title="Not Stored" copy="The OpenAI API key is not saved in the database or project files." />
              </div>
            </section>
          </div>
        )}

        {active === "templates" && <TemplatesPanel />}
      </section>
    </main>
  );
}

function TextField({ label, value, onChange, readOnly = false, type = "text", span = false }) {
  return (
    <label className={`field ${span ? "span-2" : ""}`}>
      <span className="label">{label}</span>
      <input
        className="input"
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}

function ConnectButton({ label, logo, active, loading, disabled, onConnect }) {
  if (active) {
    return (
      <button className="btn success" disabled>
        <img src={logo} alt="" className="btn-logo" />
        {label} Connected
      </button>
    );
  }
  return (
    <button className="btn primary" onClick={onConnect} disabled={disabled || loading}>
      {loading ? <Loader2 size={16} className="spin" /> : <img src={logo} alt="" className="btn-logo" />}
      Connect {label}
    </button>
  );
}

function OutputPanel({ output }) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h3 className="section-title">Output</h3>
          <p className="section-copy">Raw response for debugging while we test the flow.</p>
        </div>
      </div>
      <div className="section-body">
        <pre className="output">{output}</pre>
      </div>
    </section>
  );
}

function StatusPill({ label, status, hasId }) {
  const ok = status === "ACTIVE";
  return (
    <span className={`pill ${ok ? "ok" : hasId ? "warn" : ""}`}>
      {ok ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />}
      {label}: {ok ? "active" : hasId ? status : "not connected"}
    </span>
  );
}

function MiniCard({ title, copy }) {
  return (
    <div className="mini-card">
      <strong>{title}</strong>
      <span>{copy}</span>
    </div>
  );
}

function pageTitle(active) {
  return {
    actions: "Quick Actions",
    connections: "Connections",
    assistant: "AI Assistant",
    templates: "Templates",
  }[active];
}

function pageCopy(active) {
  return {
    actions: "Toolkit-grouped actions with Quick and Custom modes — GitHub, Gmail, Calendar, and Notion.",
    connections: "Create and verify per-user Composio connected accounts for GitHub, Notion, Gmail, and Google Calendar.",
    assistant: "Chat with the Composio Tool Router across every app you've connected, using a browser-session OpenAI key.",
    templates: "Browse Notion report layouts and Gmail email templates used in Quick Actions.",
  }[active];
}

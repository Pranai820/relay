"use client";

import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";

export function ToolkitTabs({ tabs, active, onChange }) {
  return (
    <div className="toolkit-tabs">
      {tabs.map(({ id, label, logo, connected }) => (
        <button
          key={id}
          type="button"
          className={`toolkit-tab ${active === id ? "active" : ""} ${connected ? "" : "disconnected"}`}
          onClick={() => onChange(id)}
        >
          {logo && <img src={logo} alt="" className="toolkit-tab-logo" />}
          <span>{label}</span>
          {!connected && <span className="toolkit-tab-hint">Not connected</span>}
        </button>
      ))}
    </div>
  );
}

export function ToolCard({ title, description, featured = false, children, onRun, loading, runLabel = "Run" }) {
  const [mode, setMode] = useState("quick");

  return (
    <article className={`tool-card ${featured ? "featured" : ""}`}>
      <div className="tool-card-head">
        <div>
          {featured && <span className="tool-badge"><Sparkles size={12} /> Featured</span>}
          <h4 className="tool-card-title">{title}</h4>
          <p className="tool-card-copy">{description}</p>
        </div>
        <div className="mode-toggle">
          <button type="button" className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>
            <Wand2 size={14} /> Quick
          </button>
          <button type="button" className={mode === "custom" ? "active" : ""} onClick={() => setMode("custom")}>
            Custom
          </button>
        </div>
      </div>

      <div className="tool-card-body">
        {mode === "quick" ? children.quick : children.custom}
      </div>

      <div className="tool-card-foot">
        <button type="button" className="btn primary" onClick={() => onRun(mode)} disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : null}
          {runLabel}
        </button>
      </div>
    </article>
  );
}

export function Field({ label, children, span = false }) {
  return (
    <label className={`field ${span ? "span-2" : ""}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Input({ value, onChange, type = "text", placeholder, readOnly = false }) {
  return (
    <input
      className="input"
      type={type}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

export function Select({ value, onChange, options }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea className="textarea" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}

export function NotionParentPicker({ value, onChange, pages, loading, onRefresh }) {
  return (
    <Field label="Notion parent page" span>
      <div className="picker-row">
        <Select
          value={value}
          onChange={onChange}
          options={[
            { value: "", label: loading ? "Loading pages…" : "Select a parent page" },
            ...pages.map((p) => ({ value: p.id, label: p.title })),
          ]}
        />
        <button type="button" className="btn" onClick={onRefresh} disabled={loading}>Refresh</button>
      </div>
    </Field>
  );
}

export function ResultShell({ title, subtitle, children, actions }) {
  return (
    <section className="result-shell">
      <div className="result-head">
        <div>
          <h3 className="result-title">{title}</h3>
          {subtitle && <p className="result-subtitle">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="result-body">{children}</div>
    </section>
  );
}

export function StatTiles({ items }) {
  return (
    <div className="stat-tiles">
      {items.map((item) => (
        <div key={item.label} className="stat-tile">
          <span className="stat-value">{item.value}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message }) {
  return <p className="empty-state">{message}</p>;
}

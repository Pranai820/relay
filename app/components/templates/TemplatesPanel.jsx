"use client";

import { EMAIL_TEMPLATES } from "@/lib/actions/email-templates";
import { FileText, GitBranch, Mail, Calendar, NotebookTabs } from "lucide-react";

const NOTION_REPORTS = [
  {
    title: "Repository Report",
    toolkit: "GitHub",
    icon: GitBranch,
    copy: "Repo overview, open issues, pull requests, comment highlights, and traffic stats — written as clean markdown in Notion.",
    sections: ["Overview table", "Open issues", "Open PRs", "Discussion highlights", "Traffic (14 days)"],
  },
  {
    title: "Inbox Digest",
    toolkit: "Gmail",
    icon: Mail,
    copy: "Unread and recent emails grouped with stats, top senders, and a scannable message table in Notion.",
    sections: ["Stats tiles", "Top senders", "Message table with previews"],
  },
  {
    title: "Week Ahead Agenda",
    toolkit: "Calendar",
    icon: Calendar,
    copy: "Your next 7 days of events grouped by day with times, locations, and attendee counts.",
    sections: ["Day-by-day agenda", "Event times & locations", "Attendee counts"],
  },
];

const EMAIL_TEMPLATE_CARDS = EMAIL_TEMPLATES.map((t) => ({
  title: t.label,
  copy: `Tokens: ${t.tokens.map((x) => x.label).join(", ")}`,
}));

export default function TemplatesPanel() {
  return (
    <div className="templates-layout">
      <section className="section">
        <div className="section-head">
          <div>
            <h3 className="section-title">Notion Report Templates</h3>
            <p className="section-copy">Cross-tool workflows that build polished Notion pages from your connected apps.</p>
          </div>
        </div>
        <div className="section-body template-grid">
          {NOTION_REPORTS.map((item) => (
            <article key={item.title} className="template-card featured-template">
              <div className="template-icon"><item.icon size={22} /></div>
              <div>
                <span className="template-toolkit">{item.toolkit}</span>
                <h4>{item.title}</h4>
                <p>{item.copy}</p>
                <ul className="template-sections">
                  {item.sections.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h3 className="section-title">Email Templates</h3>
            <p className="section-copy">Structured templates with token fields for Send, Draft, and Reply in Quick Actions → Gmail.</p>
          </div>
        </div>
        <div className="section-body template-grid email-templates">
          {EMAIL_TEMPLATE_CARDS.map((item) => (
            <article key={item.title} className="template-card">
              <div className="template-icon"><Mail size={20} /></div>
              <div>
                <h4>{item.title}</h4>
                <p>{item.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h3 className="section-title">How to use</h3>
            <p className="section-copy">Templates are not separate runs — they power the Quick Actions UI.</p>
          </div>
        </div>
        <div className="section-body how-to-grid">
          <div className="how-to-step"><NotebookTabs size={18} /><span>Notion reports → Quick Actions → pick toolkit → featured “→ Notion” card</span></div>
          <div className="how-to-step"><Mail size={18} /><span>Email templates → Quick Actions → Gmail → Send or Draft → choose template</span></div>
          <div className="how-to-step"><FileText size={18} /><span>Every action has Quick (minimal) and Custom (full control) modes</span></div>
        </div>
      </section>
    </div>
  );
}

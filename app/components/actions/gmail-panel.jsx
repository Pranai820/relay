"use client";

import { useEffect, useState } from "react";
import { EMAIL_TEMPLATES, applyTemplate } from "@/lib/actions/email-templates";
import { runTool, runWorkflow, searchNotionPages } from "./api";
import { pickArgs, parseBool, parseCsv, parseIntField } from "./custom-args";
import { BoolSelect, NumberInput } from "./custom-fields";
import FileUploadField from "./file-upload";
import { Field, Input, NotionParentPicker, Select, TextArea, ToolCard } from "./shared";

function TemplateFields({ templateId, tokenValues, setTokenValues }) {
  const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;
  return (
    <div className="token-grid">
      {template.tokens.map((token) => (
        <Field key={token.key} label={token.label}>
          <Input
            value={tokenValues[token.key] || ""}
            onChange={(v) => setTokenValues({ ...tokenValues, [token.key]: v })}
            placeholder={token.placeholder}
          />
        </Field>
      ))}
    </div>
  );
}

export default function GmailPanel({ connected, notionConnected, userEmail, onResult, loadingKey, setLoadingKey, replyContext, clearReply }) {
  const [notionPages, setNotionPages] = useState([]);
  const [parentId, setParentId] = useState("");
  const [digestTitle, setDigestTitle] = useState("");

  const [fetchQuery, setFetchQuery] = useState("is:unread in:inbox");
  const [fetchLabels, setFetchLabels] = useState("");
  const [fetchMax, setFetchMax] = useState("30");
  const [fetchPageToken, setFetchPageToken] = useState("");
  const [fetchIncludePayload, setFetchIncludePayload] = useState("");
  const [fetchIncludeSpamTrash, setFetchIncludeSpamTrash] = useState("");
  const [fetchIdsOnly, setFetchIdsOnly] = useState("");
  const [fetchVerbose, setFetchVerbose] = useState("true");

  const [to, setTo] = useState("");
  const [extraRecipients, setExtraRecipients] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isHtml, setIsHtml] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [draftThreadId, setDraftThreadId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [tokenValues, setTokenValues] = useState({});
  const [sendFiles, setSendFiles] = useState([]);
  const [draftFiles, setDraftFiles] = useState([]);

  const [replyBody, setReplyBody] = useState("");
  const [replyCc, setReplyCc] = useState("");
  const [replyBcc, setReplyBcc] = useState("");
  const [replyIsHtml, setReplyIsHtml] = useState("");
  const [replyTemplateId, setReplyTemplateId] = useState("");
  const [replyTokenValues, setReplyTokenValues] = useState({});
  const [replyFiles, setReplyFiles] = useState([]);

  useEffect(() => {
    if (notionConnected) searchNotionPages("").then(setNotionPages).catch(() => setNotionPages([]));
  }, [notionConnected]);

  useEffect(() => {
    if (replyContext) {
      setReplyBody("");
      setReplyTemplateId("");
      setReplyTokenValues({});
    }
  }, [replyContext]);

  useEffect(() => {
    if (!replyTemplateId) return;
    const template = EMAIL_TEMPLATES.find((t) => t.id === replyTemplateId);
    if (!template) return;
    setReplyBody(applyTemplate(template, replyTokenValues).body);
  }, [replyTemplateId, replyTokenValues]);

  useEffect(() => {
    if (!templateId) return;
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const applied = applyTemplate(template, tokenValues);
    setSubject(applied.subject);
    setBody(applied.body);
  }, [templateId, tokenValues]);

  async function exec(key, fn) {
    setLoadingKey(key);
    try {
      onResult(await fn());
    } catch (e) {
      onResult({ error: e.message });
    } finally {
      setLoadingKey("");
    }
  }

  if (!connected) {
    return <p className="toolkit-hint">Connect Gmail in the Connections tab to use these actions.</p>;
  }

  const templateOptions = [{ value: "", label: "No template" }, ...EMAIL_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))];

  const templateSelect = (
    <Field label="Template (optional)" span>
      <Select value={templateId} onChange={setTemplateId} options={templateOptions} />
    </Field>
  );

  const replyTemplateSelect = (
    <Field label="Template (optional)" span>
      <Select value={replyTemplateId} onChange={setReplyTemplateId} options={templateOptions} />
    </Field>
  );

  const sendDraftFields = (
    <>
      <Field label="To (recipient_email)"><Input value={to} onChange={setTo} placeholder="user@example.com" /></Field>
      <Field label="Extra recipients (comma-separated)"><Input value={extraRecipients} onChange={setExtraRecipients} /></Field>
      <Field label="CC (comma-separated)"><Input value={cc} onChange={setCc} /></Field>
      <Field label="BCC (comma-separated)"><Input value={bcc} onChange={setBcc} /></Field>
      <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
      <Field label="Body" span><TextArea value={body} onChange={setBody} rows={8} /></Field>
      <BoolSelect label="is_html" value={isHtml} onChange={setIsHtml} />
      <Field label="from_email"><Input value={fromEmail} onChange={setFromEmail} placeholder={userEmail || "verified alias"} /></Field>
    </>
  );

  return (
    <div className="toolkit-grid">
      <ToolCard
        title="Fetch Emails"
        description="Unread inbox messages with previews — reply inline from results."
        loading={loadingKey === "gm-fetch"}
        onRun={(mode) => exec("gm-fetch", () => runTool({
          toolSlug: "GMAIL_FETCH_EMAILS",
          mode,
          args: mode === "custom" ? pickArgs({
            user_id: "me",
            query: fetchQuery,
            label_ids: parseCsv(fetchLabels),
            max_results: parseIntField(fetchMax),
            page_token: fetchPageToken,
            include_payload: parseBool(fetchIncludePayload),
            include_spam_trash: parseBool(fetchIncludeSpamTrash),
            ids_only: parseBool(fetchIdsOnly),
            verbose: parseBool(fetchVerbose),
          }) : {},
        }))}
      >
        {{
          quick: <p className="quick-hint">Fetches unread inbox (20 messages).</p>,
          custom: (
            <>
              <Field label="query" span><Input value={fetchQuery} onChange={setFetchQuery} placeholder="is:unread in:inbox" /></Field>
              <Field label="label_ids (comma-separated)"><Input value={fetchLabels} onChange={setFetchLabels} placeholder="INBOX,UNREAD" /></Field>
              <NumberInput label="max_results" value={fetchMax} onChange={setFetchMax} placeholder="30" />
              <Field label="page_token"><Input value={fetchPageToken} onChange={setFetchPageToken} /></Field>
              <BoolSelect label="include_payload" value={fetchIncludePayload} onChange={setFetchIncludePayload} />
              <BoolSelect label="include_spam_trash" value={fetchIncludeSpamTrash} onChange={setFetchIncludeSpamTrash} />
              <BoolSelect label="ids_only" value={fetchIdsOnly} onChange={setFetchIdsOnly} />
              <BoolSelect label="verbose" value={fetchVerbose} onChange={setFetchVerbose} />
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Send Email"
        description="Compose and send with optional templates."
        loading={loadingKey === "gm-send"}
        runLabel="Send"
        onRun={(mode) => {
          if (!to && !cc && !bcc) return onResult({ error: "At least one recipient (To, CC, or BCC) is required." });
          return exec("gm-send", () => runTool({
            toolSlug: "GMAIL_SEND_EMAIL",
            mode: "custom",
            args: pickArgs({
              user_id: "me",
              recipient_email: to,
              extra_recipients: parseCsv(extraRecipients),
              cc: parseCsv(cc),
              bcc: parseCsv(bcc),
              subject,
              body,
              is_html: parseBool(isHtml),
              from_email: fromEmail,
            }),
            uploadIds: sendFiles.map((f) => f.id),
          }).then((r) => { setSendFiles([]); return r; }));
        }}
      >
        {{
          quick: (
            <>
              {templateSelect}
              {templateId ? <TemplateFields templateId={templateId} tokenValues={tokenValues} setTokenValues={setTokenValues} /> : null}
              <Field label="To"><Input value={to} onChange={setTo} placeholder="user@example.com" /></Field>
              <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
              <Field label="Body" span><TextArea value={body} onChange={setBody} /></Field>
              <FileUploadField files={sendFiles} onChange={setSendFiles} />
            </>
          ),
          custom: (
            <>
              {templateSelect}
              <TemplateFields templateId={templateId} tokenValues={tokenValues} setTokenValues={setTokenValues} />
              {sendDraftFields}
              <FileUploadField files={sendFiles} onChange={setSendFiles} />
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Create Draft"
        description="Save a draft with the same template support as Send."
        loading={loadingKey === "gm-draft"}
        runLabel="Save Draft"
        onRun={(mode) => exec("gm-draft", () => runTool({
          toolSlug: "GMAIL_CREATE_EMAIL_DRAFT",
          mode: "custom",
          args: pickArgs({
            user_id: "me",
            recipient_email: to,
            extra_recipients: parseCsv(extraRecipients),
            cc: parseCsv(cc),
            bcc: parseCsv(bcc),
            subject,
            body,
            is_html: parseBool(isHtml),
            thread_id: draftThreadId,
          }),
          uploadIds: draftFiles.map((f) => f.id),
        }).then((r) => { setDraftFiles([]); return r; }))}
      >
        {{
          quick: (
            <>
              {templateSelect}
              {templateId ? <TemplateFields templateId={templateId} tokenValues={tokenValues} setTokenValues={setTokenValues} /> : null}
              <Field label="To"><Input value={to} onChange={setTo} /></Field>
              <Field label="Subject"><Input value={subject} onChange={setSubject} /></Field>
              <Field label="Body" span><TextArea value={body} onChange={setBody} /></Field>
              <FileUploadField files={draftFiles} onChange={setDraftFiles} />
            </>
          ),
          custom: (
            <>
              {templateSelect}
              <TemplateFields templateId={templateId} tokenValues={tokenValues} setTokenValues={setTokenValues} />
              {sendDraftFields}
              <Field label="thread_id"><Input value={draftThreadId} onChange={setDraftThreadId} placeholder="Reply in existing thread" /></Field>
              <FileUploadField files={draftFiles} onChange={setDraftFiles} />
            </>
          ),
        }}
      </ToolCard>

      {replyContext && (
        <article className="tool-card featured reply-card">
          <h4 className="tool-card-title">Reply to: {replyContext.subject || "(No subject)"}</h4>
          <p className="tool-card-copy">To: {replyContext.from}</p>
          {replyTemplateSelect}
          <TemplateFields templateId={replyTemplateId} tokenValues={replyTokenValues} setTokenValues={setReplyTokenValues} />
          <Field label="message_body" span><TextArea value={replyBody} onChange={setReplyBody} rows={6} /></Field>
          <Field label="CC (comma-separated)"><Input value={replyCc} onChange={setReplyCc} /></Field>
          <Field label="BCC (comma-separated)"><Input value={replyBcc} onChange={setReplyBcc} /></Field>
          <BoolSelect label="is_html" value={replyIsHtml} onChange={setReplyIsHtml} />
          <FileUploadField files={replyFiles} onChange={setReplyFiles} />
          <div className="tool-card-foot">
            <button
              type="button"
              className="btn"
              onClick={() => { clearReply(); setReplyBody(""); setReplyTemplateId(""); setReplyTokenValues({}); }}
            >Cancel</button>
            <button
              type="button"
              className="btn primary"
              disabled={loadingKey === "gm-reply"}
              onClick={() => exec("gm-reply", () => runTool({
                toolSlug: "GMAIL_REPLY_TO_THREAD",
                mode: "custom",
                args: pickArgs({
                  thread_id: replyContext.threadId,
                  recipient_email: replyContext.fromEmail || replyContext.from,
                  message_body: replyBody,
                  user_id: "me",
                  cc: parseCsv(replyCc),
                  bcc: parseCsv(replyBcc),
                  is_html: parseBool(replyIsHtml),
                }),
                uploadIds: replyFiles.map((f) => f.id),
              }).then((r) => { setReplyFiles([]); clearReply(); return r; }))}
            >Send Reply</button>
          </div>
        </article>
      )}

      {notionConnected && (
        <ToolCard
          featured
          title="Inbox Digest → Notion"
          description="Turn unread emails into a detailed, readable Notion report."
          loading={loadingKey === "gm-digest"}
          runLabel="Create Report"
          onRun={() => {
            if (!parentId) return onResult({ error: "Select a Notion parent page." });
            return exec("gm-digest", () => runWorkflow("gmailInboxDigest", {
              parentId, title: digestTitle || undefined, query: fetchQuery,
            }));
          }}
        >
          {{
            quick: (
              <NotionParentPicker value={parentId} onChange={setParentId} pages={notionPages} onRefresh={() => searchNotionPages("").then(setNotionPages)} />
            ),
            custom: (
              <>
                <Field label="Gmail query"><Input value={fetchQuery} onChange={setFetchQuery} /></Field>
                <Field label="Report title"><Input value={digestTitle} onChange={setDigestTitle} /></Field>
                <NotionParentPicker value={parentId} onChange={setParentId} pages={notionPages} onRefresh={() => searchNotionPages("").then(setNotionPages)} />
              </>
            ),
          }}
        </ToolCard>
      )}
    </div>
  );
}

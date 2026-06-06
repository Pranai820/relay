"use client";

import { useEffect, useState } from "react";
import { runTool, runWorkflow, searchNotionPages } from "./api";
import { pickArgs, parseIntField } from "./custom-args";
import { BoolSelect, NumberInput } from "./custom-fields";
import { Field, Input, NotionParentPicker, Select, ToolCard } from "./shared";

export default function GitHubPanel({ connected, notionConnected, onResult, loadingKey, setLoadingKey }) {
  const [repos, setRepos] = useState([]);
  const [notionPages, setNotionPages] = useState([]);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [parentId, setParentId] = useState("");
  const [reportTitle, setReportTitle] = useState("");

  const [repoType, setRepoType] = useState("");
  const [repoSort, setRepoSort] = useState("updated");
  const [repoDirection, setRepoDirection] = useState("desc");
  const [repoSince, setRepoSince] = useState("");
  const [repoBefore, setRepoBefore] = useState("");
  const [repoPerPage, setRepoPerPage] = useState("30");
  const [repoPage, setRepoPage] = useState("1");

  const [searchQ, setSearchQ] = useState("assignee:@me is:open");
  const [searchSort, setSearchSort] = useState("");
  const [searchOrder, setSearchOrder] = useState("desc");
  const [searchPerPage, setSearchPerPage] = useState("20");
  const [searchPage, setSearchPage] = useState("1");
  const [searchDetail, setSearchDetail] = useState("");

  const [issueState, setIssueState] = useState("open");
  const [issueLabels, setIssueLabels] = useState("");
  const [issueSort, setIssueSort] = useState("created");
  const [issueDirection, setIssueDirection] = useState("desc");
  const [issueSince, setIssueSince] = useState("");
  const [issueAssignee, setIssueAssignee] = useState("");
  const [issueCreator, setIssueCreator] = useState("");
  const [issueMentioned, setIssueMentioned] = useState("");
  const [issueMilestone, setIssueMilestone] = useState("");
  const [issueType, setIssueType] = useState("");
  const [issuePerPage, setIssuePerPage] = useState("30");
  const [issuePage, setIssuePage] = useState("1");

  const [prState, setPrState] = useState("open");
  const [prHead, setPrHead] = useState("");
  const [prBase, setPrBase] = useState("");
  const [prSort, setPrSort] = useState("created");
  const [prDirection, setPrDirection] = useState("desc");
  const [prPerPage, setPrPerPage] = useState("30");
  const [prPage, setPrPage] = useState("1");

  const [viewsPer, setViewsPer] = useState("day");

  useEffect(() => {
    if (connected) loadRepos();
    if (notionConnected) loadPages();
  }, [connected, notionConnected]);

  async function loadRepos() {
    try {
      const data = await runTool({ toolSlug: "GITHUB_LIST_REPOSITORIES_FOR_THE_AUTHENTICATED_USER", mode: "quick" });
      const list = data.result?.repositories || data.result?.items || [];
      setRepos(list);
      if (list[0] && !repo) {
        const [o, r] = (list[0].full_name || "").split("/");
        setOwner(o || "");
        setRepo(r || "");
      }
    } catch {
      // ignore
    }
  }

  async function loadPages() {
    try {
      setNotionPages(await searchNotionPages(""));
    } catch {
      setNotionPages([]);
    }
  }

  function repoSelect() {
    const full = repos.find((r) => r.full_name === `${owner}/${repo}`)?.full_name
      || repos.find((r) => r.name === repo)?.full_name;
    const [o, r] = (full || `${owner}/${repo}`).split("/");
    return { owner: o, repo: r };
  }

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
    return <p className="toolkit-hint">Connect GitHub in the Connections tab to use these actions.</p>;
  }

  const repoField = (
    <Field label="Repository">
      <Select
        value={repos.length ? `${owner}/${repo}` : ""}
        onChange={(v) => {
          const [o, r] = v.split("/");
          setOwner(o);
          setRepo(r);
        }}
        options={[
          { value: "", label: "Select repository" },
          ...repos.map((r) => ({ value: r.full_name, label: r.full_name })),
        ]}
      />
    </Field>
  );

  const ownerRepoFields = (
    <>
      <Field label="Owner (override)"><Input value={owner} onChange={setOwner} placeholder="org or user" /></Field>
      <Field label="Repo (override)"><Input value={repo} onChange={setRepo} placeholder="repo-name" /></Field>
    </>
  );

  return (
    <div className="toolkit-grid">
      <ToolCard
        title="List Repositories"
        description="Your repos sorted by most recently updated."
        loading={loadingKey === "gh-repos"}
        onRun={(mode) => exec("gh-repos", () => runTool({
          toolSlug: "GITHUB_LIST_REPOSITORIES_FOR_THE_AUTHENTICATED_USER",
          mode,
          args: mode === "custom" ? pickArgs({
            type: repoType || undefined,
            sort: repoSort,
            direction: repoDirection,
            since: repoSince,
            before: repoBefore,
            per_page: parseIntField(repoPerPage),
            page: parseIntField(repoPage),
          }) : {},
        }))}
      >
        {{
          quick: <p className="quick-hint">Runs instantly — no input needed.</p>,
          custom: (
            <>
              <Field label="Type">
                <Select value={repoType} onChange={setRepoType} options={[
                  { value: "", label: "Default (all)" },
                  { value: "all", label: "all" },
                  { value: "owner", label: "owner" },
                  { value: "public", label: "public" },
                  { value: "private", label: "private" },
                  { value: "member", label: "member" },
                ]} />
              </Field>
              <Field label="Sort">
                <Select value={repoSort} onChange={setRepoSort} options={[
                  { value: "updated", label: "updated" },
                  { value: "created", label: "created" },
                  { value: "pushed", label: "pushed" },
                  { value: "full_name", label: "full_name" },
                ]} />
              </Field>
              <Field label="Direction">
                <Select value={repoDirection} onChange={setRepoDirection} options={[
                  { value: "desc", label: "desc" },
                  { value: "asc", label: "asc" },
                ]} />
              </Field>
              <Field label="Since (ISO 8601)"><Input value={repoSince} onChange={setRepoSince} placeholder="2026-01-01T00:00:00Z" /></Field>
              <Field label="Before (ISO 8601)"><Input value={repoBefore} onChange={setRepoBefore} /></Field>
              <NumberInput label="Per page" value={repoPerPage} onChange={setRepoPerPage} placeholder="30" />
              <NumberInput label="Page" value={repoPage} onChange={setRepoPage} placeholder="1" />
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Search Issues & PRs"
        description="Find open items assigned to you by default."
        loading={loadingKey === "gh-search"}
        onRun={(mode) => exec("gh-search", () => runTool({
          toolSlug: "GITHUB_SEARCH_ISSUES_AND_PULL_REQUESTS",
          mode,
          args: mode === "custom" ? pickArgs({
            q: searchQ,
            sort: searchSort || undefined,
            order: searchOrder,
            per_page: parseIntField(searchPerPage),
            page: parseIntField(searchPage),
            response_detail: searchDetail || undefined,
          }) : {},
        }))}
      >
        {{
          quick: <p className="quick-hint">Searches: assignee:@me is:open</p>,
          custom: (
            <>
              <Field label="Query (q)" span><Input value={searchQ} onChange={setSearchQ} placeholder="repo:owner/name is:issue state:open" /></Field>
              <Field label="Sort">
                <Select value={searchSort} onChange={setSearchSort} options={[
                  { value: "", label: "Default" },
                  { value: "comments", label: "comments" },
                  { value: "reactions", label: "reactions" },
                  { value: "interactions", label: "interactions" },
                  { value: "created", label: "created" },
                  { value: "updated", label: "updated" },
                ]} />
              </Field>
              <Field label="Order">
                <Select value={searchOrder} onChange={setSearchOrder} options={[
                  { value: "desc", label: "desc" },
                  { value: "asc", label: "asc" },
                ]} />
              </Field>
              <NumberInput label="Per page" value={searchPerPage} onChange={setSearchPerPage} />
              <NumberInput label="Page" value={searchPage} onChange={setSearchPage} />
              <Field label="Response detail">
                <Select value={searchDetail} onChange={setSearchDetail} options={[
                  { value: "", label: "Default" },
                  { value: "minimal", label: "minimal" },
                  { value: "full", label: "full" },
                ]} />
              </Field>
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="List Repository Issues"
        description="Open issues for a selected repository."
        loading={loadingKey === "gh-issues"}
        onRun={(mode) => {
          const { owner: o, repo: r } = repoSelect();
          return exec("gh-issues", () => runTool({
            toolSlug: "GITHUB_LIST_REPOSITORY_ISSUES",
            mode,
            args: mode === "custom" ? pickArgs({
              owner: o, repo: r, state: issueState, labels: issueLabels,
              sort: issueSort, direction: issueDirection, since: issueSince,
              assignee: issueAssignee, creator: issueCreator, mentioned: issueMentioned,
              milestone: issueMilestone, type: issueType,
              per_page: parseIntField(issuePerPage), page: parseIntField(issuePage),
            }) : { owner: o, repo: r, state: issueState },
          }));
        }}
      >
        {{
          quick: repoField,
          custom: (
            <>
              {repoField}
              {ownerRepoFields}
              <Field label="State">
                <Select value={issueState} onChange={setIssueState} options={[
                  { value: "open", label: "open" },
                  { value: "closed", label: "closed" },
                  { value: "all", label: "all" },
                ]} />
              </Field>
              <Field label="Labels (comma-separated)"><Input value={issueLabels} onChange={setIssueLabels} placeholder="bug,ui" /></Field>
              <Field label="Sort">
                <Select value={issueSort} onChange={setIssueSort} options={[
                  { value: "created", label: "created" },
                  { value: "updated", label: "updated" },
                  { value: "comments", label: "comments" },
                ]} />
              </Field>
              <Field label="Direction">
                <Select value={issueDirection} onChange={setIssueDirection} options={[
                  { value: "desc", label: "desc" },
                  { value: "asc", label: "asc" },
                ]} />
              </Field>
              <Field label="Since (ISO 8601)"><Input value={issueSince} onChange={setIssueSince} /></Field>
              <Field label="Assignee"><Input value={issueAssignee} onChange={setIssueAssignee} placeholder="username, none, *" /></Field>
              <Field label="Creator"><Input value={issueCreator} onChange={setIssueCreator} /></Field>
              <Field label="Mentioned"><Input value={issueMentioned} onChange={setIssueMentioned} /></Field>
              <Field label="Milestone"><Input value={issueMilestone} onChange={setIssueMilestone} placeholder="number, *, none" /></Field>
              <Field label="Type"><Input value={issueType} onChange={setIssueType} placeholder="*, none" /></Field>
              <NumberInput label="Per page" value={issuePerPage} onChange={setIssuePerPage} />
              <NumberInput label="Page" value={issuePage} onChange={setIssuePage} />
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="List Pull Requests"
        description="Open pull requests for a selected repository."
        loading={loadingKey === "gh-prs"}
        onRun={(mode) => {
          const { owner: o, repo: r } = repoSelect();
          return exec("gh-prs", () => runTool({
            toolSlug: "GITHUB_LIST_PULL_REQUESTS",
            mode,
            args: mode === "custom" ? pickArgs({
              owner: o, repo: r, state: prState, head: prHead, base: prBase,
              sort: prSort, direction: prDirection,
              per_page: parseIntField(prPerPage), page: parseIntField(prPage),
            }) : { owner: o, repo: r },
          }));
        }}
      >
        {{
          quick: repoField,
          custom: (
            <>
              {repoField}
              {ownerRepoFields}
              <Field label="State">
                <Select value={prState} onChange={setPrState} options={[
                  { value: "open", label: "open" },
                  { value: "closed", label: "closed" },
                  { value: "all", label: "all" },
                ]} />
              </Field>
              <Field label="Head"><Input value={prHead} onChange={setPrHead} placeholder="user:branch" /></Field>
              <Field label="Base"><Input value={prBase} onChange={setPrBase} placeholder="main" /></Field>
              <Field label="Sort">
                <Select value={prSort} onChange={setPrSort} options={[
                  { value: "created", label: "created" },
                  { value: "updated", label: "updated" },
                  { value: "popularity", label: "popularity" },
                  { value: "long-running", label: "long-running" },
                ]} />
              </Field>
              <Field label="Direction">
                <Select value={prDirection} onChange={setPrDirection} options={[
                  { value: "desc", label: "desc" },
                  { value: "asc", label: "asc" },
                ]} />
              </Field>
              <NumberInput label="Per page" value={prPerPage} onChange={setPrPerPage} />
              <NumberInput label="Page" value={prPage} onChange={setPrPage} />
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Repository Traffic"
        description="Page views and unique visitors for the last 14 days."
        loading={loadingKey === "gh-views"}
        onRun={(mode) => {
          const { owner: o, repo: r } = repoSelect();
          return exec("gh-views", () => runTool({
            toolSlug: "GITHUB_GET_PAGE_VIEWS",
            mode,
            args: mode === "custom" ? pickArgs({ owner: o, repo: r, per: viewsPer }) : { owner: o, repo: r },
          }));
        }}
      >
        {{
          quick: repoField,
          custom: (
            <>
              {repoField}
              {ownerRepoFields}
              <Field label="Per">
                <Select value={viewsPer} onChange={setViewsPer} options={[
                  { value: "day", label: "day" },
                  { value: "week", label: "week" },
                ]} />
              </Field>
            </>
          ),
        }}
      </ToolCard>

      {notionConnected && (
        <ToolCard
          featured
          title="Build Repo Report → Notion"
          description="Pull repo details, issues, PRs, and comments into a polished Notion report."
          loading={loadingKey === "gh-report"}
          runLabel="Create Report"
          onRun={() => {
            const { owner: o, repo: r } = repoSelect();
            if (!parentId) return onResult({ error: "Select a Notion parent page." });
            return exec("gh-report", () => runWorkflow("githubRepoReport", {
              owner: o, repo: r, parentId, title: reportTitle || undefined,
            }));
          }}
        >
          {{
            quick: (
              <>
                {repoField}
                <NotionParentPicker value={parentId} onChange={setParentId} pages={notionPages} onRefresh={loadPages} />
              </>
            ),
            custom: (
              <>
                {repoField}
                {ownerRepoFields}
                <Field label="Report title"><Input value={reportTitle} onChange={setReportTitle} placeholder="Repo Report — owner/repo" /></Field>
                <NotionParentPicker value={parentId} onChange={setParentId} pages={notionPages} onRefresh={loadPages} />
              </>
            ),
          }}
        </ToolCard>
      )}
    </div>
  );
}

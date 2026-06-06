"use client";

import { useEffect, useState } from "react";
import { runTool, searchNotionPages } from "./api";
import { pickArgs, parseBool, parseCsv, parseIntField, parseJson } from "./custom-args";
import { BoolSelect, JsonArea, NumberInput } from "./custom-fields";
import { Field, Input, Select, TextArea, ToolCard } from "./shared";

export default function NotionPanel({ connected, onResult, loadingKey, setLoadingKey }) {
  const [pages, setPages] = useState([]);
  const [databases, setDatabases] = useState([]);

  const [searchQ, setSearchQ] = useState("");
  const [searchFilterValue, setSearchFilterValue] = useState("page");
  const [searchFilterProperty, setSearchFilterProperty] = useState("object");
  const [searchDirection, setSearchDirection] = useState("");
  const [searchTimestamp, setSearchTimestamp] = useState("");
  const [searchPageSize, setSearchPageSize] = useState("25");
  const [searchCursor, setSearchCursor] = useState("");
  const [searchFilterProps, setSearchFilterProps] = useState("");

  const [fetchType, setFetchType] = useState("all");
  const [fetchQuery, setFetchQuery] = useState("");
  const [fetchPageSize, setFetchPageSize] = useState("50");
  const [fetchCursor, setFetchCursor] = useState("");

  const [databaseId, setDatabaseId] = useState("");
  const [querySorts, setQuerySorts] = useState("");
  const [queryPageSize, setQueryPageSize] = useState("25");
  const [queryCursor, setQueryCursor] = useState("");

  const [filterJson, setFilterJson] = useState("");
  const [filterSorts, setFilterSorts] = useState("");
  const [filterPageSize, setFilterPageSize] = useState("25");
  const [filterCursor, setFilterCursor] = useState("");

  const [rowTitle, setRowTitle] = useState("");
  const [insertProperties, setInsertProperties] = useState("");
  const [insertChildBlocks, setInsertChildBlocks] = useState("");
  const [insertIcon, setInsertIcon] = useState("");
  const [insertCover, setInsertCover] = useState("");

  const [updateRowId, setUpdateRowId] = useState("");
  const [updateProperties, setUpdateProperties] = useState("");
  const [updateDeleteRow, setUpdateDeleteRow] = useState("");
  const [updateIcon, setUpdateIcon] = useState("");
  const [updateCover, setUpdateCover] = useState("");

  const [fetchRowId, setFetchRowId] = useState("");

  const [parentId, setParentId] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [pageIcon, setPageIcon] = useState("");
  const [pageCover, setPageCover] = useState("");

  const [appendPageId, setAppendPageId] = useState("");
  const [appendBlocks, setAppendBlocks] = useState("");
  const [appendAfter, setAppendAfter] = useState("");
  const [appendText, setAppendText] = useState("");

  useEffect(() => {
    if (connected) refreshPickers();
  }, [connected]);

  async function refreshPickers() {
    try {
      const pageResults = await searchNotionPages("");
      setPages(pageResults);
      const dbData = await runTool({ toolSlug: "NOTION_SEARCH_NOTION_PAGE", mode: "custom", args: { query: "", filter_value: "database", page_size: 25 } });
      const dbs = (dbData.result?.results || []).map((d) => ({
        id: d.id,
        title: d.title?.[0]?.plain_text || "Untitled database",
      }));
      setDatabases(dbs);
      if (dbs[0] && !databaseId) setDatabaseId(dbs[0].id);
      if (pageResults[0] && !parentId) setParentId(pageResults[0].id);
    } catch {
      // ignore
    }
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

  function buildInsertProperties() {
    if (insertProperties.trim()) return parseJson(insertProperties, "properties");
    if (!rowTitle) return undefined;
    return [{ name: "Name", type: "title", value: rowTitle }];
  }

  if (!connected) {
    return <p className="toolkit-hint">Connect Notion in the Connections tab to use these actions.</p>;
  }

  const parentPicker = (
    <Field label="parent_id" span>
      <Select
        value={parentId}
        onChange={setParentId}
        options={[{ value: "", label: "Select parent" }, ...pages.map((p) => ({ value: p.id, label: p.title }))]}
      />
    </Field>
  );

  const dbPicker = (
    <Field label="database_id" span>
      <Select
        value={databaseId}
        onChange={setDatabaseId}
        options={[{ value: "", label: "Select database" }, ...databases.map((d) => ({ value: d.id, label: d.title }))]}
      />
    </Field>
  );

  const pagePicker = (value, onChange) => (
    <Field label="Page" span>
      <Select value={value} onChange={onChange} options={[{ value: "", label: "Select page" }, ...pages.map((p) => ({ value: p.id, label: p.title }))]} />
    </Field>
  );

  return (
    <div className="toolkit-grid">
      <ToolCard
        title="Find Pages & Databases"
        description="Search or list recent workspace items."
        loading={loadingKey === "no-search"}
        onRun={(mode) => exec("no-search", () => runTool({
          toolSlug: "NOTION_SEARCH_NOTION_PAGE",
          mode,
          args: mode === "custom" ? pickArgs({
            query: searchQ,
            filter_value: searchFilterValue,
            filter_property: searchFilterProperty,
            direction: searchDirection || undefined,
            timestamp: searchTimestamp || undefined,
            page_size: parseIntField(searchPageSize),
            start_cursor: searchCursor,
            filter_properties: parseCsv(searchFilterProps),
          }) : {},
        }))}
      >
        {{
          quick: <p className="quick-hint">Lists recent pages.</p>,
          custom: (
            <>
              <Field label="query" span><Input value={searchQ} onChange={setSearchQ} placeholder="project hub, tasks (empty = all)" /></Field>
              <Field label="filter_value">
                <Select value={searchFilterValue} onChange={setSearchFilterValue} options={[
                  { value: "page", label: "page" },
                  { value: "database", label: "database" },
                ]} />
              </Field>
              <Field label="filter_property"><Input value={searchFilterProperty} onChange={setSearchFilterProperty} placeholder="object" /></Field>
              <Field label="direction">
                <Select value={searchDirection} onChange={setSearchDirection} options={[
                  { value: "", label: "Default" },
                  { value: "ascending", label: "ascending" },
                  { value: "descending", label: "descending" },
                ]} />
              </Field>
              <Field label="timestamp">
                <Select value={searchTimestamp} onChange={setSearchTimestamp} options={[
                  { value: "", label: "Default" },
                  { value: "last_edited_time", label: "last_edited_time" },
                ]} />
              </Field>
              <NumberInput label="page_size" value={searchPageSize} onChange={setSearchPageSize} />
              <Field label="start_cursor"><Input value={searchCursor} onChange={setSearchCursor} /></Field>
              <Field label="filter_properties (comma-separated)"><Input value={searchFilterProps} onChange={setSearchFilterProps} /></Field>
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="List Workspace"
        description="Everything you can access — pages and databases."
        loading={loadingKey === "no-fetch"}
        onRun={(mode) => exec("no-fetch", () => runTool({
          toolSlug: "NOTION_FETCH_DATA",
          mode,
          args: mode === "custom" ? pickArgs({
            fetch_type: fetchType,
            query: fetchQuery,
            page_size: parseIntField(fetchPageSize),
            start_cursor: fetchCursor,
          }) : {},
        }))}
      >
        {{
          quick: <p className="quick-hint">Fetches all accessible items.</p>,
          custom: (
            <>
              <Field label="fetch_type">
                <Select value={fetchType} onChange={setFetchType} options={[
                  { value: "all", label: "all" },
                  { value: "pages", label: "pages" },
                  { value: "databases", label: "databases" },
                ]} />
              </Field>
              <Field label="query" span><Input value={fetchQuery} onChange={setFetchQuery} placeholder="Optional title filter" /></Field>
              <NumberInput label="page_size" value={fetchPageSize} onChange={setFetchPageSize} />
              <Field label="start_cursor"><Input value={fetchCursor} onChange={setFetchCursor} /></Field>
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Browse Database"
        description="View rows from a selected database."
        loading={loadingKey === "no-query"}
        onRun={(mode) => {
          if (!databaseId) return onResult({ error: "Select a database." });
          let sorts;
          try { sorts = parseJson(querySorts, "sorts"); } catch (e) { return onResult({ error: e.message }); }
          return exec("no-query", () => runTool({
            toolSlug: "NOTION_QUERY_DATABASE",
            mode: "custom",
            args: pickArgs({
              database_id: databaseId,
              sorts,
              page_size: parseIntField(queryPageSize),
              start_cursor: queryCursor,
            }),
          }));
        }}
      >
        {{
          quick: dbPicker,
          custom: (
            <>
              {dbPicker}
              <JsonArea label="sorts (JSON array)" value={querySorts} onChange={setQuerySorts} placeholder='[{"property_name": "Name", "ascending": true}]' rows={4} />
              <NumberInput label="page_size" value={queryPageSize} onChange={setQueryPageSize} />
              <Field label="start_cursor"><Input value={queryCursor} onChange={setQueryCursor} /></Field>
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Query with Filter"
        description="Server-side filtered database query."
        loading={loadingKey === "no-filter"}
        onRun={() => {
          if (!databaseId) return onResult({ error: "Select a database." });
          let filter;
          let sorts;
          try {
            filter = parseJson(filterJson, "filter");
            sorts = parseJson(filterSorts, "sorts");
          } catch (e) {
            return onResult({ error: e.message });
          }
          if (!filter) return onResult({ error: "filter JSON is required." });
          return exec("no-filter", () => runTool({
            toolSlug: "NOTION_QUERY_DATABASE_WITH_FILTER",
            mode: "custom",
            args: pickArgs({
              database_id: databaseId,
              filter,
              sorts,
              page_size: parseIntField(filterPageSize),
              start_cursor: filterCursor,
            }),
          }));
        }}
      >
        {{
          quick: (
            <>
              {dbPicker}
              <JsonArea label="filter (JSON)" value={filterJson} onChange={setFilterJson} placeholder='{"property": "Status", "select": {"equals": "Done"}}' rows={5} />
            </>
          ),
          custom: (
            <>
              {dbPicker}
              <JsonArea label="filter (JSON, required)" value={filterJson} onChange={setFilterJson} rows={6} />
              <JsonArea label="sorts (JSON array)" value={filterSorts} onChange={setFilterSorts} placeholder='[{"property": "Name", "direction": "ascending"}]' rows={4} />
              <NumberInput label="page_size" value={filterPageSize} onChange={setFilterPageSize} />
              <Field label="start_cursor"><Input value={filterCursor} onChange={setFilterCursor} /></Field>
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Add Row"
        description="Insert a new row into a database."
        loading={loadingKey === "no-insert"}
        runLabel="Add Row"
        onRun={() => {
          if (!databaseId) return onResult({ error: "Database is required." });
          let properties;
          let childBlocks;
          try {
            properties = buildInsertProperties();
            childBlocks = parseJson(insertChildBlocks, "child_blocks");
          } catch (e) {
            return onResult({ error: e.message });
          }
          if (!properties?.length) return onResult({ error: "properties JSON or row title is required." });
          return exec("no-insert", () => runTool({
            toolSlug: "NOTION_INSERT_ROW_DATABASE",
            mode: "custom",
            args: pickArgs({
              database_id: databaseId,
              properties,
              child_blocks: childBlocks,
              icon: insertIcon,
              cover: insertCover,
            }),
          }));
        }}
      >
        {{
          quick: (
            <>
              {dbPicker}
              <Field label="Row title (Name)" span><Input value={rowTitle} onChange={setRowTitle} /></Field>
            </>
          ),
          custom: (
            <>
              {dbPicker}
              <Field label="Row title (quick Name field)" span><Input value={rowTitle} onChange={setRowTitle} placeholder="Used if properties JSON empty" /></Field>
              <JsonArea label="properties (JSON array, required)" value={insertProperties} onChange={setInsertProperties} placeholder='[{"name": "Name", "type": "title", "value": "Task"}]' rows={6} />
              <JsonArea label="child_blocks (JSON array)" value={insertChildBlocks} onChange={setInsertChildBlocks} rows={5} />
              <Field label="icon (emoji)"><Input value={insertIcon} onChange={setInsertIcon} placeholder="📄" /></Field>
              <Field label="cover (URL)"><Input value={insertCover} onChange={setInsertCover} /></Field>
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Update Row"
        description="Update or archive a database row."
        loading={loadingKey === "no-update"}
        runLabel="Update Row"
        onRun={() => {
          if (!updateRowId) return onResult({ error: "row_id is required." });
          let properties;
          try { properties = parseJson(updateProperties, "properties"); } catch (e) { return onResult({ error: e.message }); }
          return exec("no-update", () => runTool({
            toolSlug: "NOTION_UPDATE_ROW_DATABASE",
            mode: "custom",
            args: pickArgs({
              row_id: updateRowId,
              properties,
              delete_row: parseBool(updateDeleteRow),
              icon: updateIcon,
              cover: updateCover,
            }),
          }));
        }}
      >
        {{
          quick: (
            <>
              <Field label="row_id" span><Input value={updateRowId} onChange={setUpdateRowId} placeholder="Page UUID from query results" /></Field>
              <JsonArea label="properties (JSON array)" value={updateProperties} onChange={setUpdateProperties} rows={5} />
            </>
          ),
          custom: (
            <>
              <Field label="row_id" span><Input value={updateRowId} onChange={setUpdateRowId} /></Field>
              <JsonArea label="properties (JSON array)" value={updateProperties} onChange={setUpdateProperties} rows={6} />
              <BoolSelect label="delete_row (archive)" value={updateDeleteRow} onChange={setUpdateDeleteRow} />
              <Field label="icon (emoji)"><Input value={updateIcon} onChange={setUpdateIcon} /></Field>
              <Field label="cover (URL)"><Input value={updateCover} onChange={setUpdateCover} /></Field>
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Fetch Row"
        description="Retrieve a single database row by page ID."
        loading={loadingKey === "no-fetch-row"}
        onRun={() => {
          if (!fetchRowId) return onResult({ error: "page_id is required." });
          return exec("no-fetch-row", () => runTool({
            toolSlug: "NOTION_FETCH_ROW",
            mode: "custom",
            args: { page_id: fetchRowId },
          }));
        }}
      >
        {{
          quick: <Field label="page_id" span><Input value={fetchRowId} onChange={setFetchRowId} /></Field>,
          custom: <Field label="page_id" span><Input value={fetchRowId} onChange={setFetchRowId} placeholder="UUID from query results" /></Field>,
        }}
      </ToolCard>

      <ToolCard
        title="Create Page"
        description="New page under a parent with title and body."
        loading={loadingKey === "no-create"}
        runLabel="Create Page"
        onRun={() => {
          if (!parentId || !pageTitle) return onResult({ error: "parent_id and title are required." });
          return exec("no-create", () => runTool({
            toolSlug: "NOTION_CREATE_NOTION_PAGE",
            mode: "custom",
            args: pickArgs({
              parent_id: parentId,
              title: pageTitle,
              markdown: markdown || undefined,
              icon: pageIcon,
              cover: pageCover,
            }),
          }));
        }}
      >
        {{
          quick: (
            <>
              {parentPicker}
              <Field label="title" span><Input value={pageTitle} onChange={setPageTitle} /></Field>
              <Field label="markdown (optional)" span><TextArea value={markdown} onChange={setMarkdown} rows={4} placeholder="Write a short note…" /></Field>
            </>
          ),
          custom: (
            <>
              {parentPicker}
              <Field label="title" span><Input value={pageTitle} onChange={setPageTitle} /></Field>
              <Field label="markdown" span><TextArea value={markdown} onChange={setMarkdown} rows={10} /></Field>
              <Field label="icon (emoji)"><Input value={pageIcon} onChange={setPageIcon} placeholder="📄" /></Field>
              <Field label="cover (URL)"><Input value={pageCover} onChange={setPageCover} /></Field>
            </>
          ),
        }}
      </ToolCard>

      <ToolCard
        title="Append to Page"
        description="Add blocks to an existing page."
        loading={loadingKey === "no-append"}
        runLabel="Append"
        onRun={() => {
          if (!appendPageId) return onResult({ error: "parent_block_id is required." });
          let contentBlocks;
          try {
            contentBlocks = parseJson(appendBlocks, "content_blocks");
          } catch (e) {
            return onResult({ error: e.message });
          }
          if (!contentBlocks?.length) {
            if (!appendText) return onResult({ error: "content_blocks JSON or paragraph text is required." });
            contentBlocks = [{ block_property: "paragraph", content: appendText }];
          }
          return exec("no-append", () => runTool({
            toolSlug: "NOTION_ADD_MULTIPLE_PAGE_CONTENT",
            mode: "custom",
            args: pickArgs({
              parent_block_id: appendPageId,
              content_blocks: contentBlocks,
              after: appendAfter,
            }),
          }));
        }}
      >
        {{
          quick: (
            <>
              {pagePicker(appendPageId, setAppendPageId)}
              <Field label="Paragraph" span><TextArea value={appendText} onChange={setAppendText} rows={4} /></Field>
            </>
          ),
          custom: (
            <>
              <Field label="parent_block_id" span><Input value={appendPageId} onChange={setAppendPageId} placeholder="Page or block UUID" /></Field>
              <JsonArea label="content_blocks (JSON array, required)" value={appendBlocks} onChange={setAppendBlocks} placeholder='[{"block_property": "paragraph", "content": "Hello"}]' rows={8} />
              <Field label="after (block ID)"><Input value={appendAfter} onChange={setAppendAfter} placeholder="Insert after this block" /></Field>
              <Field label="Quick paragraph (if JSON empty)" span><TextArea value={appendText} onChange={setAppendText} rows={3} /></Field>
            </>
          ),
        }}
      </ToolCard>
    </div>
  );
}

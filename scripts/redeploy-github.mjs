import { Composio } from "@composio/core";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TOOLKIT_VERSIONS } from "../lib/actions/toolkit-versions.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  COMPOSIO_API_KEY,
  GITHUB_OWNER = "Pranai820",
  GITHUB_REPO = "relay",
  COMPOSIO_USER_ID = "user-ffc32956-8dab-4723-abb3-c7066de202dc",
  GITHUB_CONNECTED_ACCOUNT_ID = "ca_5Nm60vcT3dw6",
} = process.env;

if (!COMPOSIO_API_KEY) throw new Error("Missing COMPOSIO_API_KEY");

const COMMIT_MESSAGE = [
  "Initial commit: Relay work hub",
  "",
  "Relay connects GitHub, Notion, Gmail, and Google Calendar via Composio.",
  "Includes Quick Actions, email templates, Notion workflows, file uploads,",
  "AI assistant, Auth.js auth, and Neon Postgres (Prisma).",
].join("\n");

const composio = new Composio({ apiKey: COMPOSIO_API_KEY, toolkitVersions: TOOLKIT_VERSIONS });

async function run(toolSlug, args) {
  const r = await composio.tools.execute(toolSlug, {
    userId: COMPOSIO_USER_ID,
    connectedAccountId: GITHUB_CONNECTED_ACCOUNT_ID,
    arguments: args,
  });
  return r?.data ?? r;
}

try {
  await run("GITHUB_DELETE_A_REPOSITORY", { owner: GITHUB_OWNER, repo: GITHUB_REPO });
  console.log("Deleted existing repository.");
} catch (e) {
  console.log("Delete skipped:", e.message?.slice(0, 120));
}

const created = await run("GITHUB_CREATE_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER", {
  name: GITHUB_REPO,
  description: "Relay — connected work hub for GitHub, Notion, Gmail, and Calendar",
  private: false,
  auto_init: false,
});
console.log("Created:", created?.html_url || created?.full_name);

const files = execSync(`git -c safe.directory=${root.replace(/\\/g, "/")} ls-files`, {
  encoding: "utf8",
  cwd: root,
}).trim().split(/\r?\n/).filter(Boolean);

const BINARY_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2"]);
const upserts = files.map((f) => {
  const ext = f.slice(f.lastIndexOf(".")).toLowerCase();
  if (BINARY_EXT.has(ext)) {
    return {
      path: f,
      content: fs.readFileSync(path.join(root, f)).toString("base64"),
      encoding: "base64",
    };
  }
  return { path: f, content: fs.readFileSync(path.join(root, f), "utf8") };
});

const commit = await run("GITHUB_COMMIT_MULTIPLE_FILES", {
  owner: GITHUB_OWNER,
  repo: GITHUB_REPO,
  branch: "main",
  message: COMMIT_MESSAGE,
  upserts,
});

console.log("Committed:", commit?.commit?.sha || commit?.sha, `(${upserts.length} files)`);

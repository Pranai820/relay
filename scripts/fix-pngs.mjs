import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Composio } from "@composio/core";
import { TOOLKIT_VERSIONS } from "../lib/actions/toolkit-versions.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PNGS = ["github.png", "gmail.png", "googlecalendar.png", "notion.png"];

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  toolkitVersions: TOOLKIT_VERSIONS,
});

const userId = process.env.COMPOSIO_USER_ID || "user-ffc32956-8dab-4723-abb3-c7066de202dc";
const ca = process.env.GITHUB_CONNECTED_ACCOUNT_ID || "ca_5Nm60vcT3dw6";

for (const name of PNGS) {
  const path = `public/${name}`;
  const content = readFileSync(resolve(root, path)).toString("base64");
  const r = await composio.tools.execute("GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS", {
    userId,
    connectedAccountId: ca,
    arguments: {
      owner: "Pranai820",
      repo: "relay",
      path,
      message: `Fix ${name} binary upload`,
      content,
      encoding: "base64",
    },
  });
  console.log("fixed", name, r?.data?.content?.sha || r?.data?.sha || "ok");
}

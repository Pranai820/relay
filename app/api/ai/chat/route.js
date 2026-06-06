import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createComposioClient } from "@/lib/composio";
import { assertAllowedToolRouterCall } from "@/lib/safety";
import { getSessionUser, getUserConnections } from "@/lib/session";
import {
  buildAttachmentMessageHint,
  describeUploads,
  injectPendingAttachments,
} from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { openaiApiKey, message, previousResponseId, model, uploadIds = [] } = await request.json();

    if (!openaiApiKey || !model) {
      return NextResponse.json({ error: "Missing chat inputs." }, { status: 400 });
    }

    const trimmedMessage = String(message || "").trim();
    if (!trimmedMessage && !uploadIds.length) {
      return NextResponse.json({ error: "Enter a message or attach a file." }, { status: 400 });
    }

    if (!openaiApiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "That doesn't look like an OpenAI API key. It should start with \"sk-\". Open the AI Assistant tab and paste your key from platform.openai.com (not a URL)." },
        { status: 400 },
      );
    }

    const connections = await getUserConnections(user.id);
    const connectedAccounts = {};
    for (const [toolkit, row] of Object.entries(connections)) {
      if (row?.connectedAccountId) connectedAccounts[toolkit] = row.connectedAccountId;
    }

    if (Object.keys(connectedAccounts).length === 0) {
      return NextResponse.json(
        { error: "Connect at least one app (GitHub, Notion, Gmail, or Google Calendar) before using the AI Assistant." },
        { status: 400 },
      );
    }

    const pendingUploads = uploadIds.length ? await describeUploads(user.id, uploadIds) : [];
    if (uploadIds.length && pendingUploads.length !== uploadIds.length) {
      return NextResponse.json({ error: "One or more attachments were not found." }, { status: 400 });
    }

    const composio = createComposioClient({ withOpenAIProvider: true });
    const client = new OpenAI({ apiKey: openaiApiKey });
    const session = await composio.create(user.id, { connectedAccounts });
    const tools = await session.tools();
    const attachmentCache = { staged: null, remainingIds: [...uploadIds] };

    const instructions = [
      "You are a productivity assistant connected to GitHub, Notion, Gmail, and Google Calendar via Composio.",
      "GitHub is strictly read-only. Never create, update, delete, comment, label, close, merge, or otherwise write to GitHub.",
      "Notion read and write actions are allowed (create pages, reports, and task notes).",
      "Gmail actions are allowed (read, search, draft, and send email). Confirm recipients and content from the user's request before sending.",
      "When the user attaches files, include them as Gmail attachments when sending or drafting email. The backend stages attachments automatically for Gmail send, draft, and reply tools.",
      "Google Calendar actions are allowed (read availability, create, update, and delete events).",
      "Only use tools for apps the user has actually connected. If a needed app is not connected, tell the user to connect it first.",
      "Prefer useful combined workflows across the connected apps.",
      "Do not use remote shell or remote workbench tools.",
      "When asked to write to GitHub, refuse and offer a Notion planning alternative.",
    ].join(" ");

    const userContent = `${trimmedMessage || "Please use the attached file(s)."}${buildAttachmentMessageHint(pendingUploads)}`;

    let response = await client.responses.create({
      model,
      instructions,
      tools,
      previous_response_id: previousResponseId || undefined,
      input: [{ role: "user", content: userContent }],
    });

    while (true) {
      const toolCalls = response.output.filter((item) => item.type === "function_call");
      if (toolCalls.length === 0) break;

      const toolOutputs = await Promise.all(toolCalls.map(async (toolCall) => {
        let args = toolCall.arguments ? JSON.parse(toolCall.arguments) : {};
        assertAllowedToolRouterCall(toolCall.name, args);
        args = await injectPendingAttachments({
          userId: user.id,
          uploadIds,
          toolName: toolCall.name,
          args,
          cache: attachmentCache,
        });

        return {
          type: "function_call_output",
          call_id: toolCall.call_id,
          output: JSON.stringify(await session.execute(toolCall.name, args)),
        };
      }));

      response = await client.responses.create({
        model,
        instructions,
        tools,
        previous_response_id: response.id,
        input: toolOutputs,
      });
    }

    const text = response.output
      .flatMap((item) => item.type === "message" ? item.content : [])
      .filter((content) => content.type === "output_text")
      .map((content) => content.text)
      .join("\n");

    return NextResponse.json({ text, responseId: response.id });
  } catch (error) {
    console.error("[/api/ai/chat] error", {
      name: error?.name,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      requestId: error?.request_id,
      url: error?.url,
      message: String(error?.message || "").slice(0, 500),
    });

    const status = typeof error?.status === "number" ? error.status : 500;
    const raw = String(error?.message || "Unknown error");
    const looksLikeHtml = raw.trimStart().startsWith("<");
    const message = looksLikeHtml
      ? `Upstream returned ${status} with a non-JSON (HTML) body. The request likely did not reach the OpenAI API correctly. Check the model name and that no proxy/base URL is redirecting requests.`
      : raw;

    return NextResponse.json({ error: message, status, code: error?.code }, { status });
  }
}

import { NextResponse } from "next/server";
import { executeTool, normalizeToolResult } from "@/lib/composio";
import { mergeQuickArgs } from "@/lib/actions/quick-defaults";
import { TOOLKIT_CONNECTION_KEY, toolkitFromSlug } from "@/lib/actions/toolkit-versions";
import {
  runCalendarWeekAhead,
  runGithubRepoReport,
  runGmailInboxDigest,
} from "@/lib/actions/workflows";
import { assertAllowedTool } from "@/lib/safety";
import { getSessionUser, getUserConnections } from "@/lib/session";
import { assertOwnCalendarEvent } from "@/lib/calendar-ownership";
import { GMAIL_ATTACHMENT_TOOLS, stageUploadsForTool } from "@/lib/uploads";

const CALENDAR_MUTATION_TOOLS = new Set([
  "GOOGLECALENDAR_PATCH_EVENT",
  "GOOGLECALENDAR_DELETE_EVENT",
]);

export const runtime = "nodejs";

const WORKFLOWS = {
  githubRepoReport: runGithubRepoReport,
  gmailInboxDigest: runGmailInboxDigest,
  calendarWeekAhead: runCalendarWeekAhead,
};

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const connections = await getUserConnections(user.id);

    if (body.workflow) {
      const handler = WORKFLOWS[body.workflow];
      if (!handler) {
        return NextResponse.json({ ok: false, error: "Unknown workflow." }, { status: 400 });
      }
      const result = await handler({
        userId: user.id,
        githubAccountId: connections.github?.connectedAccountId,
        gmailAccountId: connections.gmail?.connectedAccountId,
        calendarAccountId: connections.googlecalendar?.connectedAccountId,
        notionAccountId: connections.notion?.connectedAccountId,
        ...body.payload,
      });
      return NextResponse.json({ ok: true, kind: "workflow", workflow: body.workflow, result });
    }

    const { toolSlug, mode = "quick", args = {}, uploadIds = [] } = body;
    if (!toolSlug) {
      return NextResponse.json({ ok: false, error: "Missing toolSlug." }, { status: 400 });
    }

    assertAllowedTool(toolSlug);

    const toolkit = toolkitFromSlug(toolSlug);
    const connKey = TOOLKIT_CONNECTION_KEY[toolkit];
    const connectedAccountId = connections[connKey]?.connectedAccountId;

    if (!connectedAccountId) {
      return NextResponse.json(
        { ok: false, error: `Connect ${toolkit} before running this action.` },
        { status: 400 },
      );
    }

    const finalArgs = mode === "quick" ? mergeQuickArgs(toolSlug, args) : args;

    if (GMAIL_ATTACHMENT_TOOLS.has(toolSlug) && uploadIds.length > 0) {
      finalArgs.attachment = await stageUploadsForTool({
        userId: user.id,
        uploadIds,
        toolSlug,
        toolkitSlug: "gmail",
      });
    }

    if (CALENDAR_MUTATION_TOOLS.has(toolSlug)) {
      await assertOwnCalendarEvent({
        executeTool,
        userId: user.id,
        connectedAccountId,
        userEmail: user.email,
        eventId: finalArgs.event_id,
        calendarId: finalArgs.calendar_id || "primary",
      });
    }

    const raw = await executeTool({
      toolSlug,
      userId: user.id,
      connectedAccountId,
      args: finalArgs,
    });

    return NextResponse.json({
      ok: true,
      kind: "tool",
      toolSlug,
      toolkit,
      result: normalizeToolResult(raw),
      raw: raw?.data ? raw : undefined,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

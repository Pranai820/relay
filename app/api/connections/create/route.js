import { NextResponse } from "next/server";
import { COMPOSIO_API_KEY, COMPOSIO_BASE_URL, TOOLKIT_CONFIG, requireServerConfig } from "@/lib/config";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    requireServerConfig();

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { toolkit, callbackUrl } = await request.json();
    const config = TOOLKIT_CONFIG[toolkit];

    if (!config) {
      return NextResponse.json({ error: "Missing or invalid toolkit." }, { status: 400 });
    }
    if (!config.authConfigId) {
      return NextResponse.json(
        { error: `No auth config set for ${config.label}. Add its *_AUTH_CONFIG_ID to the environment.` },
        { status: 500 },
      );
    }

    const response = await fetch(`${COMPOSIO_BASE_URL}/connected_accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": COMPOSIO_API_KEY,
      },
      body: JSON.stringify({
        auth_config: { id: config.authConfigId },
        connection: {
          user_id: user.id,
          callback_url: callbackUrl,
        },
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: body.error?.message || body.error || "Connection failed." },
        { status: response.status },
      );
    }

    const connectedAccountId = body.id;
    const redirectUrl = body.redirect_url || body.redirect_uri || body.connectionData?.val?.redirectUrl;
    const status = body.status || "INITIATED";

    if (connectedAccountId) {
      await prisma.connection.upsert({
        where: { userId_toolkit: { userId: user.id, toolkit } },
        create: { userId: user.id, toolkit, connectedAccountId, status },
        update: { connectedAccountId, status },
      });
    }

    return NextResponse.json({ id: connectedAccountId, redirectUrl, status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

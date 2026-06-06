import { NextResponse } from "next/server";
import { COMPOSIO_API_KEY, COMPOSIO_BASE_URL, requireServerConfig } from "@/lib/config";
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

    const { toolkit } = await request.json().catch(() => ({}));

    const rows = await prisma.connection.findMany({
      where: { userId: user.id, ...(toolkit ? { toolkit } : {}) },
    });

    const disconnected = [];

    for (const row of rows) {
      const response = await fetch(`${COMPOSIO_BASE_URL}/connected_accounts/${row.connectedAccountId}`, {
        method: "DELETE",
        headers: { "x-api-key": COMPOSIO_API_KEY },
      });

      const deleted = response.ok || response.status === 404;
      if (deleted) {
        await prisma.connection.delete({ where: { id: row.id } });
      }
      disconnected.push({ toolkit: row.toolkit, id: row.connectedAccountId, deleted });
    }

    return NextResponse.json({ ok: true, disconnected });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

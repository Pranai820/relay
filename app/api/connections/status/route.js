import { NextResponse } from "next/server";
import { COMPOSIO_API_KEY, COMPOSIO_BASE_URL, requireServerConfig } from "@/lib/config";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  try {
    requireServerConfig();

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const rows = await prisma.connection.findMany({ where: { userId: user.id } });
    const statuses = {};

    for (const row of rows) {
      const response = await fetch(`${COMPOSIO_BASE_URL}/connected_accounts/${row.connectedAccountId}`, {
        method: "GET",
        headers: { "x-api-key": COMPOSIO_API_KEY },
      });
      const data = await response.json().catch(() => ({}));
      const status = data.status || data.state?.val?.status || "unknown";
      statuses[row.toolkit] = status;
      await prisma.connection.update({ where: { id: row.id }, data: { status } });
    }

    return NextResponse.json(statuses);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

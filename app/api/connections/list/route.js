import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const rows = await prisma.connection.findMany({ where: { userId: user.id } });
    const connections = {};
    for (const row of rows) {
      connections[row.toolkit] = { id: row.connectedAccountId, status: row.status };
    }

    return NextResponse.json({ userId: user.id, email: user.email, connections });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

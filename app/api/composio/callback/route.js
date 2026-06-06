import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.searchParams);
  params.set("connected", "true");

  try {
    const user = await getSessionUser();
    const connectedAccountId = url.searchParams.get("connectedAccountId");
    const appName = (url.searchParams.get("appName") || "").toLowerCase();
    const toolkit = appName.includes("github")
      ? "github"
      : appName.includes("notion")
        ? "notion"
        : appName.includes("gmail")
          ? "gmail"
          : appName.includes("calendar")
            ? "googlecalendar"
            : null;

    if (user && connectedAccountId && toolkit) {
      await prisma.connection.upsert({
        where: { userId_toolkit: { userId: user.id, toolkit } },
        create: { userId: user.id, toolkit, connectedAccountId, status: "ACTIVE" },
        update: { connectedAccountId, status: "ACTIVE" },
      });
    }
  } catch {
    // best-effort persistence; the status check will reconcile
  }

  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const isLocalhost = forwardedHost.startsWith("localhost") || forwardedHost.startsWith("127.0.0.1");
  const forwardedProto = request.headers.get("x-forwarded-proto") || (isLocalhost ? "http" : url.protocol.replace(":", ""));

  const base = `${forwardedProto}://${forwardedHost}`;
  return NextResponse.redirect(new URL(`/?${params.toString()}`, base));
}

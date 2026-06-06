import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await auth();
  return session?.user?.id ? session.user : null;
}

export async function getUserConnections(userId) {
  const rows = await prisma.connection.findMany({ where: { userId } });
  const byToolkit = {};
  for (const row of rows) {
    byToolkit[row.toolkit] = row;
  }
  return byToolkit;
}

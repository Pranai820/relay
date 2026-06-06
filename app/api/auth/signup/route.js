import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getPasswordError } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = String(email || "").toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const passwordError = getPasswordError(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

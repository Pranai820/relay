import { NextResponse } from "next/server";
import { deleteUploadedFile, saveUploadedFile } from "@/lib/uploads";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveUploadedFile({
      userId: user.id,
      name: file.name,
      mimetype: file.type || "application/octet-stream",
      buffer,
    });

    return NextResponse.json({ ok: true, file: saved });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { uploadId } = await request.json();
    if (!uploadId) {
      return NextResponse.json({ error: "Missing uploadId." }, { status: 400 });
    }

    const deleted = await deleteUploadedFile(user.id, uploadId);
    if (!deleted) {
      return NextResponse.json({ error: "Upload not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

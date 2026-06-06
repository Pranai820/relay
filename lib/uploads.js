import { createComposioClient } from "@/lib/composio";
import { prisma } from "@/lib/prisma";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ORPHAN_MAX_AGE_MS = 60 * 60 * 1000;

export const GMAIL_ATTACHMENT_TOOLS = new Set([
  "GMAIL_SEND_EMAIL",
  "GMAIL_CREATE_EMAIL_DRAFT",
  "GMAIL_REPLY_TO_THREAD",
]);

export async function cleanupOrphanUploads(userId) {
  const cutoff = new Date(Date.now() - ORPHAN_MAX_AGE_MS);
  await prisma.uploadedFile.deleteMany({
    where: { userId, createdAt: { lt: cutoff } },
  });
}

export async function saveUploadedFile({ userId, name, mimetype, buffer }) {
  if (!buffer?.length) throw new Error("Empty file.");
  if (buffer.length > MAX_FILE_BYTES) {
    throw new Error("File exceeds 25 MB limit.");
  }
  if (!mimetype?.includes("/")) {
    throw new Error("Invalid MIME type.");
  }

  await cleanupOrphanUploads(userId);

  return prisma.uploadedFile.create({
    data: {
      userId,
      name,
      mimetype,
      size: buffer.length,
      data: buffer,
    },
    select: { id: true, name: true, mimetype: true, size: true, createdAt: true },
  });
}

export async function deleteUploadedFile(userId, uploadId) {
  const row = await prisma.uploadedFile.findFirst({ where: { id: uploadId, userId } });
  if (!row) return false;
  await prisma.uploadedFile.delete({ where: { id: uploadId } });
  return true;
}

export async function stageUploadsForTool({ userId, uploadIds, toolSlug, toolkitSlug }) {
  if (!uploadIds?.length) return undefined;

  const rows = await prisma.uploadedFile.findMany({
    where: { userId, id: { in: uploadIds } },
  });

  if (rows.length !== uploadIds.length) {
    throw new Error("One or more attachments were not found or already used.");
  }

  const totalSize = rows.reduce((sum, row) => sum + row.size, 0);
  if (totalSize > MAX_FILE_BYTES) {
    throw new Error("Total attachment size exceeds 25 MB.");
  }

  const composio = createComposioClient();
  const staged = [];

  for (const row of rows) {
    const file = new File([row.data], row.name, { type: row.mimetype });
    const descriptor = await composio.files.upload({
      file,
      toolSlug,
      toolkitSlug,
    });
    staged.push(descriptor);
    await prisma.uploadedFile.delete({ where: { id: row.id } });
  }

  return staged.length === 1 ? staged[0] : staged;
}

export async function describeUploads(userId, uploadIds) {
  if (!uploadIds?.length) return [];
  return prisma.uploadedFile.findMany({
    where: { userId, id: { in: uploadIds } },
    select: { id: true, name: true, mimetype: true, size: true },
    orderBy: { createdAt: "asc" },
  });
}

function firstGmailAttachmentToolSlug(toolName, args) {
  if (GMAIL_ATTACHMENT_TOOLS.has(toolName)) return toolName;
  if (toolName !== "COMPOSIO_MULTI_EXECUTE_TOOL" || !Array.isArray(args?.tools)) return null;
  const match = args.tools.find((item) => GMAIL_ATTACHMENT_TOOLS.has(item?.tool_slug));
  return match?.tool_slug || null;
}

function toolCallNeedsAttachments(toolName, args) {
  return Boolean(firstGmailAttachmentToolSlug(toolName, args));
}

async function getOrStageAttachments(cache, { userId, uploadIds, toolSlug }) {
  if (cache.staged) return cache.staged;
  if (!cache.remainingIds?.length) return undefined;
  cache.staged = await stageUploadsForTool({
    userId,
    uploadIds: cache.remainingIds,
    toolSlug,
    toolkitSlug: "gmail",
  });
  cache.remainingIds = [];
  return cache.staged;
}

export async function injectPendingAttachments({ userId, uploadIds, toolName, args, cache }) {
  if (!uploadIds?.length || !toolCallNeedsAttachments(toolName, args)) return args;

  const toolSlug = firstGmailAttachmentToolSlug(toolName, args);
  if (!toolSlug) return args;

  const attachment = await getOrStageAttachments(cache, { userId, uploadIds, toolSlug });
  if (!attachment) return args;

  if (toolName === "COMPOSIO_MULTI_EXECUTE_TOOL" && Array.isArray(args.tools)) {
    return {
      ...args,
      tools: args.tools.map((item) => (
        GMAIL_ATTACHMENT_TOOLS.has(item?.tool_slug)
          ? { ...item, arguments: { ...(item.arguments || {}), attachment } }
          : item
      )),
    };
  }

  return { ...args, attachment };
}

export function buildAttachmentMessageHint(files) {
  if (!files?.length) return "";
  const names = files.map((file) => `${file.name} (${file.mimetype})`).join(", ");
  return `\n\n[The user attached ${files.length} file(s): ${names}. When sending or drafting email, include these as attachments.]`;
}

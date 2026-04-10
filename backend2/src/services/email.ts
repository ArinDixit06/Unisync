import { Buffer } from "node:buffer";

import { load } from "cheerio";
import quotedPrintable from "quoted-printable";

export function cleanHtml(html: string): string {
  if (!html) return "";
  const $ = load(html);
  $("script").remove();
  return $.html();
}

export function extractPreview(text: string, maxLen = 200): string {
  return text ? text.replace(/\s+/g, " ").trim().slice(0, maxLen) : "";
}

function decodePart(data: string, transferEncoding?: string | null): string {
  try {
    const padded = data + "=".repeat((4 - (data.length % 4 || 4)) % 4);
    let decoded = Buffer.from(padded, "base64url");
    if (transferEncoding?.toLowerCase().includes("quoted-printable")) {
      decoded = Buffer.from(quotedPrintable.decode(decoded.toString("utf8")));
    }
    return decoded.toString("utf8");
  } catch {
    return "";
  }
}

function getTransferEncoding(part: any): string | null {
  for (const header of part?.headers ?? []) {
    if (String(header?.name ?? "").toLowerCase() === "content-transfer-encoding") {
      return String(header.value ?? "");
    }
  }
  return null;
}

async function getPartData(part: any, fetchAttachment: ((attachmentId: string) => Promise<string>) | null): Promise<string> {
  const encoding = getTransferEncoding(part);
  const data = part?.body?.data;
  if (data) return decodePart(data, encoding);
  const attachmentId = part?.body?.attachmentId;
  if (attachmentId && fetchAttachment) {
    try {
      const attachmentData = await fetchAttachment(attachmentId);
      return attachmentData ? decodePart(attachmentData, encoding) : "";
    } catch {
      return "";
    }
  }
  return "";
}

function normalizeContentId(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.replace(/[<>]/g, "").trim().toLowerCase() || null;
}

function getHeader(part: any, name: string): string | null {
  for (const header of part?.headers ?? []) {
    if (String(header?.name ?? "").toLowerCase() === name.toLowerCase()) {
      return String(header.value ?? "");
    }
  }
  return null;
}

function isInlineImagePart(part: any): boolean {
  const disposition = String(getHeader(part, "content-disposition") ?? "").toLowerCase();
  const contentId = normalizeContentId(getHeader(part, "content-id"));
  return String(part?.mimeType ?? "").toLowerCase().startsWith("image/") && (Boolean(contentId) || disposition.includes("inline"));
}

function replaceCidSources(html: string, inlineAssets: Array<{ contentId: string; dataUrl: string }>): string {
  if (!html || !inlineAssets.length) return html;
  let output = html;
  for (const asset of inlineAssets) {
    const escaped = asset.contentId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    output = output.replace(new RegExp(`cid:${escaped}`, "gi"), asset.dataUrl);
  }
  return output;
}

async function collectInlineGmailAssets(
  payload: any,
  fetchAttachment: ((attachmentId: string) => Promise<string>) | null
): Promise<Array<{ contentId: string; dataUrl: string }>> {
  if (!payload) return [];
  const assets: Array<{ contentId: string; dataUrl: string }> = [];
  const stack = [payload];
  while (stack.length) {
    const part = stack.pop();
    if (!part) continue;
    if (Array.isArray(part.parts)) {
      stack.push(...part.parts);
    }
    if (!isInlineImagePart(part)) continue;
    const contentId = normalizeContentId(getHeader(part, "content-id"));
    const bodyData = await getPartData(part, fetchAttachment);
    if (!contentId || !bodyData) continue;
    const mimeType = String(part.mimeType || "image/png");
    const base64 = Buffer.from(bodyData, "utf8").toString("base64");
    assets.push({ contentId, dataUrl: `data:${mimeType};base64,${base64}` });
  }
  return assets;
}

async function extractGmailBody(payload: any, fetchAttachment: ((attachmentId: string) => Promise<string>) | null): Promise<string> {
  if (!payload) return "";
  const parts = payload.parts ?? [];
  if (parts.length) {
    for (const mimeType of ["text/html", "text/plain"]) {
      for (const part of parts) {
        if (part.mimeType === mimeType) {
          const data = await getPartData(part, fetchAttachment);
          if (data) return data;
        }
      }
    }
    for (const part of parts) {
      const nested = await extractGmailBody(part, fetchAttachment);
      if (nested) return nested;
    }
    return "";
  }
  const mimeType = payload.mimeType ?? "";
  if (payload.body && (mimeType === "text/html" || mimeType === "text/plain" || !mimeType)) {
    return getPartData(payload, fetchAttachment);
  }
  return "";
}

export async function parseGmailMessage(
  message: any,
  fetchAttachment: ((attachmentId: string) => Promise<string>) | null
): Promise<Record<string, unknown>> {
  const payload = message.payload ?? {};
  const headerMap = Object.fromEntries((payload.headers ?? []).filter((h: any) => h?.name).map((h: any) => [String(h.name).toLowerCase(), h.value]));
  const body = await extractGmailBody(payload, fetchAttachment);
  const inlineAssets = await collectInlineGmailAssets(payload, fetchAttachment);
  const sender = String(headerMap.from ?? "");
  return {
    message_id: message.id,
    thread_id: message.threadId,
    subject: headerMap.subject ?? null,
    sender_name: sender.includes("<") ? sender.split("<", 1)[0].trim() : sender,
    sender_email: sender.includes("<") ? sender.split("<").at(-1)?.replace(">", "").trim() : sender,
    received_at: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null,
    snippet: message.snippet,
    body: replaceCidSources(body, inlineAssets),
    headers: headerMap
  };
}

export function parseOutlookMessage(message: any): Record<string, unknown> {
  const sender = message?.from?.emailAddress ?? {};
  const attachments: any[] = Array.isArray(message?.attachments) ? message.attachments : [];
  const inlineAssets = attachments
    .filter((attachment: any) => attachment?.isInline && attachment?.contentId && attachment?.contentBytes)
    .map((attachment: any) => ({
      contentId: normalizeContentId(String(attachment.contentId))!,
      dataUrl: `data:${String(attachment.contentType || "image/png")};base64,${String(attachment.contentBytes)}`
    }))
    .filter((asset: { contentId: string | null }) => asset.contentId);
  return {
    message_id: message.id,
    thread_id: message.conversationId,
    subject: message.subject,
    sender_name: sender.name ?? null,
    sender_email: sender.address ?? "",
    received_at: message.receivedDateTime ?? null,
    snippet: message.bodyPreview ?? null,
    body: replaceCidSources(message?.body?.content ?? "", inlineAssets),
    headers: {}
  };
}

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
  const sender = String(headerMap.from ?? "");
  return {
    message_id: message.id,
    thread_id: message.threadId,
    subject: headerMap.subject ?? null,
    sender_name: sender.includes("<") ? sender.split("<", 1)[0].trim() : sender,
    sender_email: sender.includes("<") ? sender.split("<").at(-1)?.replace(">", "").trim() : sender,
    received_at: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null,
    snippet: message.snippet,
    body,
    headers: headerMap
  };
}

export function parseOutlookMessage(message: any): Record<string, unknown> {
  const sender = message?.from?.emailAddress ?? {};
  return {
    message_id: message.id,
    thread_id: message.conversationId,
    subject: message.subject,
    sender_name: sender.name ?? null,
    sender_email: sender.address ?? "",
    received_at: message.receivedDateTime ?? null,
    snippet: message.bodyPreview ?? null,
    body: message?.body?.content ?? "",
    headers: {}
  };
}

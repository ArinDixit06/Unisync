import { randomUUID } from "node:crypto";

import { encryptMailJson, encryptMailText } from "../mailCrypto.js";
import { publishEvent } from "../realtimeBus.js";
import { insert, select } from "../supabaseRest.js";
import { bumpUserCacheVersion } from "./cache.js";
import { cleanHtml, extractPreview } from "./email.js";
import { sanitizeHeaders } from "./security.js";

export async function storeEmail(userId: string, accountId: string, message: Record<string, any>): Promise<string> {
  const existing = await select("emails", "id", {
    filters: [
      ["account_id", "eq", accountId],
      ["message_id", "eq", String(message.message_id ?? "")]
    ],
    useService: true
  });
  if (existing[0]?.id) return existing[0].id;

  const bodyHtml = cleanHtml(String(message.body ?? ""));
  const preview = String(message.snippet ?? "") || extractPreview(bodyHtml);
  const safeHeaders = sanitizeHeaders(message.headers ?? {});
  const emailId = randomUUID();

  await insert(
    "emails",
    {
      id: emailId,
      user_id: userId,
      account_id: accountId,
      provider: message.provider,
      message_id: message.message_id,
      thread_id: message.thread_id,
      subject: message.subject,
      sender_name: message.sender_name,
      sender_email: message.sender_email,
      preview_snippet: preview,
      body_html: null,
      body_html_enc: encryptMailText(bodyHtml),
      received_at: message.received_at,
      raw_headers: null,
      raw_headers_enc: encryptMailJson(safeHeaders)
    },
    { useService: true }
  );

  await publishEvent(userId, { type: "email_received", email_id: emailId, processing_status: "pending" });
  await bumpUserCacheVersion(userId);
  return emailId;
}

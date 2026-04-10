import { randomUUID } from "node:crypto";

import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { Router } from "express";

import { AuthenticatedRequest, requireUser } from "../auth.js";
import { decrypt, encrypt } from "../crypto.js";
import { decryptMailJson, decryptMailText, encryptMailJson, encryptMailText } from "../mailCrypto.js";
import { badRequest, notFound } from "../errors.js";
import { RateLimiter, rateLimit, userKey } from "../rateLimit.js";
import { bumpUserCacheVersion } from "../services/cache.js";
import { cleanHtml, extractPreview } from "../services/email.js";
import { refreshToken as refreshGmailToken, sendMessage as sendGmailMessage } from "../services/gmail.js";
import { sendMessage as sendOutlookMessage } from "../services/outlook.js";
import { insert, remove, select, update } from "../supabaseRest.js";

const router = Router();
const sendLimiter = new RateLimiter(20, "compose-send");

router.use(requireUser);

function normalizeRecipients(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.flatMap((item) => String(item).replaceAll(";", ",").split(",").map((part) => part.trim()).filter(Boolean));
}

function hydrateDraft(row: Record<string, any>) {
  return {
    ...row,
    to_list: decryptMailJson(row.to_list_enc ?? row.to_list, []),
    cc_list: decryptMailJson(row.cc_list_enc ?? row.cc_list, []),
    bcc_list: decryptMailJson(row.bcc_list_enc ?? row.bcc_list, []),
    subject: decryptMailText(row.subject_enc) ?? row.subject,
    body_html: decryptMailText(row.body_html_enc) ?? row.body_html
  };
}

async function buildRawEmail(payload: any, fromEmail: string, to: string[], cc: string[], bcc: string[]): Promise<string> {
  const customHeaders: Record<string, string> = {};
  if (payload.in_reply_to) customHeaders["In-Reply-To"] = String(payload.in_reply_to);
  if (payload.references) customHeaders["References"] = String(payload.references);
  const composer = new MailComposer({
    from: fromEmail || undefined,
    to: to.join(", "),
    cc: cc.length ? cc.join(", ") : undefined,
    bcc: bcc.length ? bcc.join(", ") : undefined,
    subject: payload.subject,
    html: payload.body_html,
    headers: customHeaders,
    attachments: (payload.attachments ?? []).map((att: any) => ({
      filename: att.filename,
      content: Buffer.from(String(att.content_base64 ?? ""), "base64"),
      contentType: att.content_type
    }))
  });
  const message = await composer.compile().build();
  return Buffer.from(message).toString("base64url");
}

async function handleSend(request: AuthenticatedRequest, response: any, next: any) {
  try {
    const to = normalizeRecipients(request.body.to);
    const cc = normalizeRecipients(request.body.cc);
    const bcc = normalizeRecipients(request.body.bcc);
    if (!to.length && !cc.length && !bcc.length) badRequest("Please add at least one recipient.");
    const accounts = await select("linked_accounts", "id,provider,access_token_enc,refresh_token_enc,email_address,display_name", {
      filters: [["id", "eq", request.body.account_id], ["user_id", "eq", request.currentUser!.userId]],
      userToken: request.currentUser!.token
    });
    if (!accounts.length) notFound("Linked account not found");
    const account = accounts[0];
    let accessToken = decrypt(account.access_token_enc);
    const refreshToken = decrypt(account.refresh_token_enc || "");
    let messageId: string | null = null;
    let threadId: string | null = null;
    if (account.provider === "gmail") {
      const raw = await buildRawEmail(request.body, account.email_address || "", to, cc, bcc);
      try {
        const sent = await sendGmailMessage(accessToken, raw, request.body.thread_id ? String(request.body.thread_id) : null);
        messageId = sent.id ?? null;
        threadId = sent.threadId ?? null;
      } catch (error: any) {
        if (![401, 403].includes(Number(error?.status)) || !refreshToken) throw error;
        const refreshed = await refreshGmailToken(refreshToken);
        accessToken = refreshed.access_token || "";
        if (!accessToken) badRequest("Gmail token expired. Please reconnect Gmail.");
        await update("linked_accounts", { access_token_enc: encrypt(accessToken) }, {
          filters: [["id", "eq", request.body.account_id], ["user_id", "eq", request.currentUser!.userId]],
          userToken: request.currentUser!.token
        });
        const sent = await sendGmailMessage(accessToken, raw, request.body.thread_id ? String(request.body.thread_id) : null);
        messageId = sent.id ?? null;
        threadId = sent.threadId ?? null;
      }
    } else if (account.provider === "outlook") {
      await sendOutlookMessage(accessToken, {
        subject: request.body.subject,
        body: { contentType: "HTML", content: request.body.body_html },
        toRecipients: to.map((address) => ({ emailAddress: { address } })),
        ccRecipients: cc.map((address) => ({ emailAddress: { address } })),
        bccRecipients: bcc.map((address) => ({ emailAddress: { address } })),
        internetMessageHeaders: [
          request.body.in_reply_to ? { name: "In-Reply-To", value: String(request.body.in_reply_to) } : null,
          request.body.references ? { name: "References", value: String(request.body.references) } : null
        ].filter(Boolean),
        attachments: (request.body.attachments ?? []).map((att: any) => ({
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: att.filename,
          contentType: att.content_type,
          contentBytes: att.content_base64
        }))
      });
    } else {
      badRequest("Unknown provider");
    }
    const bodyHtml = String(request.body.body_html ?? "");
    await insert(
      "emails",
      {
        id: randomUUID(),
        user_id: request.currentUser!.userId,
        account_id: request.body.account_id,
        provider: account.provider,
        message_id: messageId ?? randomUUID(),
        thread_id: threadId,
        subject: request.body.subject,
        sender_name: account.display_name || account.email_address,
        sender_email: account.email_address,
        preview_snippet: extractPreview(cleanHtml(bodyHtml)),
        body_html: null,
        body_html_enc: encryptMailText(bodyHtml),
        received_at: new Date().toISOString(),
        is_read: true,
        has_attachments: Boolean(request.body.attachments?.length),
        attachment_count: request.body.attachments?.length ?? 0,
        processing_status: "done",
        category: "primary"
      },
      { useService: true }
    );
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "sent" });
  } catch (error) {
    next(error);
  }
}

router.post("/send", rateLimit(sendLimiter, userKey), handleSend);

router.post("/reply", handleSend);
router.post("/forward", handleSend);

router.get("/drafts", async (request: AuthenticatedRequest, response, next) => {
  try {
    const rows = await select("drafts", "*", {
      filters: [["user_id", "eq", request.currentUser!.userId]],
      order: "updated_at.desc",
      userToken: request.currentUser!.token
    });
    response.json({ drafts: rows.map(hydrateDraft) });
  } catch (error) {
    next(error);
  }
});

router.post("/drafts", async (request: AuthenticatedRequest, response, next) => {
  try {
    await insert(
      "drafts",
      {
        user_id: request.currentUser!.userId,
        account_id: request.body.account_id,
        to_list: null,
        cc_list: null,
        bcc_list: null,
        subject: null,
        body_html: null,
        to_list_enc: encryptMailJson(request.body.to),
        cc_list_enc: encryptMailJson(request.body.cc ?? []),
        bcc_list_enc: encryptMailJson(request.body.bcc ?? []),
        subject_enc: encryptMailText(request.body.subject),
        body_html_enc: encryptMailText(request.body.body_html)
      },
      { userToken: request.currentUser!.token }
    );
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

router.put("/drafts/:draftId", async (request: AuthenticatedRequest, response, next) => {
  try {
    const draftId = String(request.params.draftId)
    await update(
      "drafts",
      {
        account_id: request.body.account_id,
        to_list: null,
        cc_list: null,
        bcc_list: null,
        subject: null,
        body_html: null,
        to_list_enc: encryptMailJson(request.body.to),
        cc_list_enc: encryptMailJson(request.body.cc ?? []),
        bcc_list_enc: encryptMailJson(request.body.bcc ?? []),
        subject_enc: encryptMailText(request.body.subject),
        body_html_enc: encryptMailText(request.body.body_html),
        updated_at: new Date().toISOString()
      },
      {
        filters: [["id", "eq", draftId], ["user_id", "eq", request.currentUser!.userId]],
        userToken: request.currentUser!.token
      }
    );
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

router.delete("/drafts/:draftId", async (request: AuthenticatedRequest, response, next) => {
  try {
    const draftId = String(request.params.draftId)
    await remove("drafts", {
      filters: [["id", "eq", draftId], ["user_id", "eq", request.currentUser!.userId]],
      userToken: request.currentUser!.token
    });
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

export default router;

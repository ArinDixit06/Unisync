import { Router } from "express";

import { decrypt } from "../crypto.js";
import { badRequest } from "../errors.js";
import { enqueueJob } from "../queue.js";
import { bumpUserCacheVersion } from "../services/cache.js";
import { fetchAttachment, fetchHistory, fetchMessage as fetchGmailMessage } from "../services/gmail.js";
import { parseGmailMessage, parseOutlookMessage } from "../services/email.js";
import { fetchMessage as fetchOutlookMessage } from "../services/outlook.js";
import { storeEmail } from "../services/store.js";
import { select } from "../supabaseRest.js";
import { verifySignature } from "../webhookSecurity.js";

const router = Router();

router.post("/gmail", async (request, response, next) => {
  try {
    const bodyBuffer = Buffer.isBuffer(request.body) ? request.body : Buffer.from(JSON.stringify(request.body ?? {}));
    verifySignature(bodyBuffer, request.header("x-unisync-signature"));
    const payload = typeof request.body === "object" ? request.body : JSON.parse(bodyBuffer.toString("utf8"));
    const data = payload?.message?.data;
    if (!data) {
      response.json({ status: "ok" });
      return;
    }
    const event = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
    if (!event.emailAddress || !event.historyId) {
      response.json({ status: "ok" });
      return;
    }
    const accounts = await select("linked_accounts", "id,user_id,access_token_enc", {
      filters: [["provider", "eq", "gmail"], ["email_address", "eq", event.emailAddress]],
      useService: true
    });
    if (!accounts.length) {
      response.json({ status: "ok" });
      return;
    }
    const account = accounts[0];
    const accessToken = decrypt(account.access_token_enc);
    const history = await fetchHistory(accessToken, event.historyId);
    for (const item of history.history ?? []) {
      for (const added of item.messagesAdded ?? []) {
        const messageId = added?.message?.id;
        if (!messageId) continue;
        const raw = await fetchGmailMessage(accessToken, messageId);
        const parsed = await parseGmailMessage(raw, (attachmentId) => fetchAttachment(accessToken, messageId, attachmentId));
        const emailId = await storeEmail(account.user_id, account.id, { ...parsed, provider: "gmail" });
        await enqueueJob("process_email", emailId);
        await bumpUserCacheVersion(account.user_id);
      }
    }
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

router.post("/outlook", async (request, response, next) => {
  try {
    const bodyBuffer = Buffer.isBuffer(request.body) ? request.body : Buffer.from(JSON.stringify(request.body ?? {}));
    verifySignature(bodyBuffer, request.header("x-unisync-signature"));
    const payload = typeof request.body === "object" ? request.body : JSON.parse(bodyBuffer.toString("utf8"));
    for (const note of payload?.value ?? []) {
      if (note.clientState && note.clientState !== "unisync") continue;
      if (!note.subscriptionId || !note.resourceData?.id) continue;
      const accounts = await select("linked_accounts", "id,user_id,access_token_enc", {
        filters: [["provider", "eq", "outlook"], ["subscription_id", "eq", note.subscriptionId]],
        useService: true
      });
      if (!accounts.length) continue;
      const account = accounts[0];
      const accessToken = decrypt(account.access_token_enc);
      const raw = await fetchOutlookMessage(accessToken, note.resourceData.id);
      const emailId = await storeEmail(account.user_id, account.id, { ...parseOutlookMessage(raw), provider: "outlook" });
      await enqueueJob("process_email", emailId);
      await bumpUserCacheVersion(account.user_id);
    }
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

export default router;

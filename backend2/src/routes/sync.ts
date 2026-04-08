import { Router } from "express";

import { AuthenticatedRequest, requireUser } from "../auth.js";
import { decrypt } from "../crypto.js";
import { notFound } from "../errors.js";
import { enqueueJob } from "../queue.js";
import { bumpUserCacheVersion, acquireRecentLock } from "../services/cache.js";
import { fetchAttachment, fetchMessage, listMessages } from "../services/gmail.js";
import { parseGmailMessage, parseOutlookMessage } from "../services/email.js";
import { fetchMessage as fetchOutlookMessage, listMessages as listOutlookMessages } from "../services/outlook.js";
import { storeEmail } from "../services/store.js";
import { select } from "../supabaseRest.js";

const router = Router();

router.use(requireUser);

router.post("/account/:accountId", async (request: AuthenticatedRequest, response, next) => {
  try {
    const accounts = await select("linked_accounts", "id,provider,access_token_enc", {
      filters: [["id", "eq", request.params.accountId], ["user_id", "eq", request.currentUser!.userId]],
      userToken: request.currentUser!.token
    });
    if (!accounts.length) notFound("Account not found");
    const account = accounts[0];
    const accessToken = decrypt(account.access_token_enc);
    let stored = 0;
    if (account.provider === "gmail") {
      const inbox = await listMessages(accessToken, 50, ["INBOX"]);
      const sent = await listMessages(accessToken, 50, ["SENT"]);
      const seen = new Set<string>();
      for (const msg of [...inbox, ...sent]) {
        if (!msg.id || seen.has(msg.id)) continue;
        seen.add(msg.id);
        if (!(await acquireRecentLock(`sync:${account.id}`, msg.id, 900))) continue;
        const raw = await fetchMessage(accessToken, msg.id);
        const parsed = await parseGmailMessage(raw, (attachmentId) => fetchAttachment(accessToken, msg.id, attachmentId));
        const emailId = await storeEmail(request.currentUser!.userId, account.id, { ...parsed, provider: "gmail" });
        await enqueueJob("process_email", emailId);
        stored += 1;
      }
    } else {
      const messages = await listOutlookMessages(accessToken);
      for (const msg of messages) {
        if (msg.id && !(await acquireRecentLock(`sync:${account.id}`, msg.id, 900))) continue;
        const raw = await fetchOutlookMessage(accessToken, msg.id);
        const emailId = await storeEmail(request.currentUser!.userId, account.id, { ...parseOutlookMessage(raw), provider: "outlook" });
        await enqueueJob("process_email", emailId);
        stored += 1;
      }
    }
    if (stored) await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok", count: stored });
  } catch (error) {
    next(error);
  }
});

export default router;

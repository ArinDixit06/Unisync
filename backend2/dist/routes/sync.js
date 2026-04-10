import { Router } from "express";
import { requireUser } from "../auth.js";
import { decrypt, encrypt } from "../crypto.js";
import { badRequest, notFound } from "../errors.js";
import { enqueueJob } from "../queue.js";
import { bumpUserCacheVersion, acquireRecentLock } from "../services/cache.js";
import { fetchAttachment, fetchMessage, listMessages, refreshToken as refreshGmailToken } from "../services/gmail.js";
import { parseGmailMessage, parseOutlookMessage } from "../services/email.js";
import { fetchMessage as fetchOutlookMessage, listMessages as listOutlookMessages } from "../services/outlook.js";
import { storeEmail } from "../services/store.js";
import { select, update } from "../supabaseRest.js";
const router = Router();
router.use(requireUser);
async function withFreshGmailAccessToken(account, userId, fn) {
    let accessToken = decrypt(account.access_token_enc);
    const refreshToken = decrypt(account.refresh_token_enc || "");
    try {
        return await fn(accessToken);
    }
    catch (error) {
        if (![401, 403].includes(Number(error?.status)) || !refreshToken)
            throw error;
        const refreshed = await refreshGmailToken(refreshToken);
        accessToken = refreshed.access_token || "";
        if (!accessToken)
            badRequest("Gmail token expired. Please reconnect Gmail.");
        await update("linked_accounts", { access_token_enc: encrypt(accessToken) }, {
            filters: [["id", "eq", account.id], ["user_id", "eq", userId]],
            useService: true
        });
        return fn(accessToken);
    }
}
router.post("/account/:accountId", async (request, response, next) => {
    try {
        const accountId = String(request.params.accountId);
        const accounts = await select("linked_accounts", "id,provider,access_token_enc,refresh_token_enc", {
            filters: [["id", "eq", accountId], ["user_id", "eq", request.currentUser.userId]],
            userToken: request.currentUser.token
        });
        if (!accounts.length)
            notFound("Account not found");
        const account = accounts[0];
        let stored = 0;
        if (account.provider === "gmail") {
            await withFreshGmailAccessToken(account, request.currentUser.userId, async (accessToken) => {
                const inbox = await listMessages(accessToken, 100, ["INBOX"]);
                const sent = await listMessages(accessToken, 50, ["SENT"]);
                const seen = new Set();
                for (const msg of [...inbox, ...sent]) {
                    if (!msg.id || seen.has(msg.id))
                        continue;
                    seen.add(msg.id);
                    if (!(await acquireRecentLock(`sync:${account.id}`, msg.id, 900)))
                        continue;
                    const raw = await fetchMessage(accessToken, msg.id);
                    const parsed = await parseGmailMessage(raw, (attachmentId) => fetchAttachment(accessToken, msg.id, attachmentId));
                    const emailId = await storeEmail(request.currentUser.userId, account.id, { ...parsed, provider: "gmail" });
                    await enqueueJob("process_email", emailId);
                    stored += 1;
                }
            });
        }
        else {
            const accessToken = decrypt(account.access_token_enc);
            const messages = await listOutlookMessages(accessToken);
            for (const msg of messages) {
                if (msg.id && !(await acquireRecentLock(`sync:${account.id}`, msg.id, 900)))
                    continue;
                const raw = await fetchOutlookMessage(accessToken, msg.id);
                const emailId = await storeEmail(request.currentUser.userId, account.id, { ...parseOutlookMessage(raw), provider: "outlook" });
                await enqueueJob("process_email", emailId);
                stored += 1;
            }
        }
        if (stored)
            await bumpUserCacheVersion(request.currentUser.userId);
        response.json({ status: "ok", count: stored });
    }
    catch (error) {
        next(error);
    }
});
export default router;

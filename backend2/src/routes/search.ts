import { Router } from "express";

import { AuthenticatedRequest, requireUser } from "../auth.js";
import { getCachedJson, getUserCacheVersion, setCachedJson } from "../services/cache.js";
import { select } from "../supabaseRest.js";

const router = Router();

router.use(requireUser);

router.get("/", async (request: AuthenticatedRequest, response, next) => {
  try {
    const q = String(request.query.q ?? "");
    const limit = Number(request.query.limit ?? 20);
    const normalizedQ = q.split(/\s+/).filter(Boolean).join(" ");
    const cachePayload = {
      user_id: request.currentUser!.userId,
      q: normalizedQ.toLowerCase(),
      limit,
      version: await getUserCacheVersion(request.currentUser!.userId)
    };
    const cached = await getCachedJson("emails:search", cachePayload);
    if (cached) {
      response.json(cached);
      return;
    }
    const rows = await select(
      "emails",
      "id,thread_id,subject,sender_name,sender_email,preview_snippet,received_at,is_read,is_starred,is_archived,is_snoozed,snoozed_until,has_attachments,processing_status,risk_level,priority_level,category,account_id,linked_accounts(provider,email_address)",
      {
        filters: [
          ["user_id", "eq", request.currentUser!.userId],
          ["search_vector", "fts", `english.${normalizedQ}`]
        ],
        order: "received_at.desc",
        limit,
        userToken: request.currentUser!.token
      }
    );
    const emails = rows.map((row) => {
      const account = row.linked_accounts ?? {};
      delete row.linked_accounts;
      return { ...row, provider: account.provider, account_email: account.email_address };
    });
    const payload = { emails };
    await setCachedJson("emails:search", cachePayload, payload, 20);
    response.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;

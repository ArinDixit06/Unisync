import * as chrono from "chrono-node";

import { load } from "cheerio";
import { Router } from "express";

import { AuthenticatedRequest, requireUser } from "../auth.js";
import { decryptMailJson, decryptMailText } from "../mailCrypto.js";
import { notFound } from "../errors.js";
import { RateLimiter, rateLimit, userKey } from "../rateLimit.js";
import { bumpUserCacheVersion, getCachedJson, getUserCacheVersion, setCachedJson } from "../services/cache.js";
import { insert, select, update } from "../supabaseRest.js";

const router = Router();
const emailLimiter = new RateLimiter(120, "emails");

router.use(requireUser);
router.use(rateLimit(emailLimiter, userKey));

function stripHtml(html: string): string {
  return load(html).text().replace(/\s+/g, " ").trim();
}

function hydrateEmail(row: Record<string, any>): Record<string, any> {
  return {
    ...row,
    body_html: decryptMailText(row.body_html_enc) || row.body_html || "",
    raw_headers: decryptMailJson(row.raw_headers_enc, row.raw_headers || {})
  };
}

function detectEvent(bodyHtml: string, subject?: string | null) {
  const text = stripHtml(bodyHtml).slice(0, 4000);
  const results = chrono.parse(text, new Date(), { forwardDate: true });
  if (!results.length) return null;
  const start = results[0].start.date();
  return {
    title: subject || "Event",
    start_datetime: start.toISOString(),
    end_datetime: null,
    location: null,
    description: results[0].text
  };
}

router.get("/", async (request: AuthenticatedRequest, response, next) => {
  try {
    const accountId = request.query.account_id ? String(request.query.account_id) : null;
    const category = request.query.category ? String(request.query.category) : null;
    const filter = request.query.filter ? String(request.query.filter) : null;
    const labelId = request.query.label_id ? String(request.query.label_id) : null;
    const offset = Number(request.query.offset ?? 0);
    const limit = Math.min(Number(request.query.limit ?? 50), 100);
    const cachePayload = {
      user_id: request.currentUser!.userId,
      accountId,
      category,
      filter,
      labelId,
      offset,
      limit,
      version: await getUserCacheVersion(request.currentUser!.userId)
    };
    const cached = await getCachedJson("emails:list", cachePayload);
    if (cached) {
      response.json(cached);
      return;
    }
    const filters: [string, string, string][] = [["user_id", "eq", request.currentUser!.userId]];
    if (accountId) filters.push(["account_id", "eq", accountId]);
    if (category) filters.push(["category", "eq", category]);
    if (filter === "trash") filters.push(["is_deleted", "eq", "true"]);
    else {
      filters.push(["is_deleted", "eq", "false"]);
      filters.push(["is_archived", "eq", "false"]);
    }
    if (filter === "unread") filters.push(["is_read", "eq", "false"]);
    else if (filter === "starred") filters.push(["is_starred", "eq", "true"]);
    else if (filter === "high_risk") filters.push(["risk_level", "eq", "high"]);
    else if (filter === "snoozed") filters.push(["is_snoozed", "eq", "true"]);
    if (labelId) {
      const labelRows = await select("email_labels", "email_id", {
        filters: [["label_id", "eq", labelId]],
        userToken: request.currentUser!.token
      });
      const emailIds = labelRows.map((row) => row.email_id);
      if (!emailIds.length) {
        response.json({ emails: [] });
        return;
      }
      filters.push(["id", "in", `(${emailIds.join(",")})`]);
    }
    const rows = await select(
      "emails",
      "id,thread_id,subject,sender_name,sender_email,preview_snippet,received_at,is_read,is_starred,is_archived,is_snoozed,snoozed_until,has_attachments,processing_status,risk_level,priority_level,category,account_id,linked_accounts(provider,email_address)",
      {
        filters,
        order: "received_at.desc",
        limit,
        offset,
        userToken: request.currentUser!.token
      }
    );
    const emails = rows.map((row) => {
      const account = row.linked_accounts ?? {};
      delete row.linked_accounts;
      return { ...row, provider: account.provider, account_email: account.email_address };
    });
    const payload = { emails, next_offset: emails.length === limit ? offset + emails.length : null };
    await setCachedJson("emails:list", cachePayload, payload, 15);
    response.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/thread/:threadId", async (request: AuthenticatedRequest, response, next) => {
  try {
    const threadId = String(request.params.threadId)
    const rows = await select("emails", "*", {
      filters: [["thread_id", "eq", threadId], ["user_id", "eq", request.currentUser!.userId]],
      order: "received_at.asc",
      userToken: request.currentUser!.token
    });
    response.json({ emails: rows.map(hydrateEmail) });
  } catch (error) {
    next(error);
  }
});

router.get("/:emailId", async (request: AuthenticatedRequest, response, next) => {
  try {
    const emailId = String(request.params.emailId)
    const rows = await select("emails", "*,linked_accounts(provider,email_address)", {
      filters: [["id", "eq", emailId], ["user_id", "eq", request.currentUser!.userId]],
      userToken: request.currentUser!.token
    });
    if (!rows.length) notFound("Email not found");
    const result: Record<string, any> = hydrateEmail(rows[0]);
    const account = result.linked_accounts ?? {};
    delete result.linked_accounts;
    result.provider = account.provider;
    result.account_email = account.email_address;
    let events = await select("suggested_events", "*", {
      filters: [["email_id", "eq", emailId], ["user_id", "eq", request.currentUser!.userId]],
      order: "created_at.desc",
      userToken: request.currentUser!.token
    });
    if (!events.length) {
      const detected = detectEvent(result.body_html || "", result.subject);
      if (detected) {
        const created = await insert("suggested_events", { email_id: emailId, user_id: request.currentUser!.userId, ...detected }, {
          userToken: request.currentUser!.token,
          returning: true
        });
        events = Array.isArray(created) ? created : created ? [created] : [];
      }
    }
    result.suggested_events = events.filter((item) => item.dismissed_at == null);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch("/:emailId", async (request: AuthenticatedRequest, response, next) => {
  try {
    const emailId = String(request.params.emailId)
    const values: Record<string, unknown> = {};
    for (const key of ["is_read", "is_starred", "is_archived"]) {
      if (request.body[key] !== undefined) values[key] = request.body[key];
    }
    if (Object.keys(values).length) {
      await update("emails", values, {
        filters: [["id", "eq", emailId], ["user_id", "eq", request.currentUser!.userId]],
        userToken: request.currentUser!.token
      });
      await bumpUserCacheVersion(request.currentUser!.userId);
    }
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:emailId", async (request: AuthenticatedRequest, response, next) => {
  try {
    const emailId = String(request.params.emailId)
    await update("emails", { is_deleted: true }, {
      filters: [["id", "eq", emailId], ["user_id", "eq", request.currentUser!.userId]],
      userToken: request.currentUser!.token
    });
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

router.post("/:emailId/snooze", async (request: AuthenticatedRequest, response, next) => {
  try {
    const emailId = String(request.params.emailId)
    await update("emails", { is_snoozed: true, snoozed_until: request.body.snoozed_until }, {
      filters: [["id", "eq", emailId], ["user_id", "eq", request.currentUser!.userId]],
      userToken: request.currentUser!.token
    });
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:emailId/snooze", async (request: AuthenticatedRequest, response, next) => {
  try {
    const emailId = String(request.params.emailId)
    await update("emails", { is_snoozed: false, snoozed_until: null }, {
      filters: [["id", "eq", emailId], ["user_id", "eq", request.currentUser!.userId]],
      userToken: request.currentUser!.token
    });
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

export default router;

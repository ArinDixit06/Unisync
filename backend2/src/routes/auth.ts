import { randomUUID } from "node:crypto";

import { Router } from "express";

import { AuthenticatedRequest, requireUser } from "../auth.js";
import { settings } from "../config.js";
import { encrypt } from "../crypto.js";
import { badRequest, notFound } from "../errors.js";
import { RateLimiter, ipKey, rateLimit } from "../rateLimit.js";
import { remove, insert, select } from "../supabaseRest.js";
import { exchangeCode as exchangeGmailCode, gmailAuthUrl, watchInbox } from "../services/gmail.js";
import { createSubscription, exchangeCode as exchangeOutlookCode, outlookAuthUrl } from "../services/outlook.js";

const router = Router();
const authLimiter = new RateLimiter(10, "auth");

router.use(rateLimit(authLimiter, ipKey));

async function storeState(userId: string, provider: string): Promise<string> {
  const state = randomUUID();
  await insert(
    "oauth_states",
    {
      id: state,
      user_id: userId,
      provider,
      expires_at: new Date(Date.now() + 15 * 60_000).toISOString()
    },
    { useService: true }
  );
  return state;
}

async function consumeState(state: string, provider: string): Promise<string> {
  const rows = await select("oauth_states", "user_id", {
    filters: [["id", "eq", state], ["provider", "eq", provider], ["expires_at", "gt", new Date().toISOString()]],
    useService: true
  });
  if (!rows.length) badRequest("Invalid OAuth state");
  await remove("oauth_states", { filters: [["id", "eq", state]], useService: true });
  return rows[0].user_id;
}

async function handleGmailCallback(code: string, state: string): Promise<string> {
  const userId = await consumeState(state, "gmail");
  const tokens = await exchangeGmailCode(code);
  const accessToken = tokens.access_token;
  if (!accessToken) badRequest("Missing access token");
  const profileResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const profile = await profileResponse.json();
  const accountId = randomUUID();
  await insert(
    "linked_accounts",
    {
      id: accountId,
      user_id: userId,
      provider: "gmail",
      email_address: profile.emailAddress,
      access_token_enc: encrypt(accessToken),
      refresh_token_enc: encrypt(tokens.refresh_token || "")
    },
    { useService: true }
  );
  await watchInbox(accessToken);
  return accountId;
}

router.post("/link/gmail", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    response.json({ auth_url: gmailAuthUrl(await storeState(request.currentUser!.userId, "gmail")) });
  } catch (error) {
    next(error);
  }
});

router.get("/callback/gmail", async (request, response, next) => {
  try {
    const accountId = await handleGmailCallback(String(request.query.code ?? ""), String(request.query.state ?? ""));
    response.redirect(`${settings.frontendUrl}/?linked=gmail&account_id=${accountId}`);
  } catch (error) {
    next(error);
  }
});

router.post("/link/outlook", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    response.json({ auth_url: outlookAuthUrl(await storeState(request.currentUser!.userId, "outlook")) });
  } catch (error) {
    next(error);
  }
});

router.get("/callback/outlook", async (request, response, next) => {
  try {
    const userId = await consumeState(String(request.query.state ?? ""), "outlook");
    const tokens = await exchangeOutlookCode(String(request.query.code ?? ""));
    const accessToken = tokens.access_token;
    if (!accessToken) badRequest("Missing access token");
    const profileResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileResponse.json();
    const subscription = await createSubscription(accessToken, `${settings.apiBaseUrl}/webhooks/outlook`);
    const accountId = randomUUID();
    await insert(
      "linked_accounts",
      {
        id: accountId,
        user_id: userId,
        provider: "outlook",
        email_address: profile.mail || profile.userPrincipalName,
        access_token_enc: encrypt(accessToken),
        refresh_token_enc: encrypt(tokens.refresh_token || ""),
        subscription_id: subscription.id,
        subscription_expires_at: subscription.expirationDateTime
      },
      { useService: true }
    );
    response.redirect(`${settings.frontendUrl}/?linked=outlook&account_id=${accountId}`);
  } catch (error) {
    next(error);
  }
});

router.post("/callback/google", async (request, response, next) => {
  try {
    const accountId = await handleGmailCallback(String(request.body.code ?? request.query.code ?? ""), String(request.body.state ?? request.query.state ?? ""));
    response.redirect(`${settings.frontendUrl}/?linked=gmail&account_id=${accountId}`);
  } catch (error) {
    next(error);
  }
});

router.get("/accounts", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    const rows = await select("linked_accounts", "id,provider,email_address,display_name,created_at", {
      filters: [["user_id", "eq", request.currentUser!.userId]],
      userToken: request.currentUser!.token
    });
    response.json({ accounts: rows });
  } catch (error) {
    next(error);
  }
});

router.delete("/accounts/:accountId", requireUser, async (request: AuthenticatedRequest, response, next) => {
  try {
    const accountId = String(request.params.accountId)
    const rows = await select("linked_accounts", "id", {
      filters: [["id", "eq", accountId], ["user_id", "eq", request.currentUser!.userId]],
      userToken: request.currentUser!.token
    });
    if (!rows.length) notFound("Account not found");
    await remove("linked_accounts", {
      filters: [["id", "eq", accountId]],
      userToken: request.currentUser!.token
    });
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

export default router;

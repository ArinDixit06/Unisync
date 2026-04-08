import { gmailRedirect, settings } from "../config.js";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/calendar"
];

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

async function asJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(text || response.statusText);
    (error as any).status = response.status;
    (error as any).responseText = text;
    throw error;
  }
  return text ? JSON.parse(text) : {};
}

export function gmailAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: settings.googleClientId,
    redirect_uri: gmailRedirect(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES.join(" "),
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<any> {
  const body = new URLSearchParams({
    client_id: settings.googleClientId,
    client_secret: settings.googleClientSecret,
    code,
    redirect_uri: gmailRedirect(),
    grant_type: "authorization_code"
  });
  return asJson(await fetch("https://oauth2.googleapis.com/token", { method: "POST", body }));
}

export async function refreshToken(refreshTokenValue: string): Promise<any> {
  const body = new URLSearchParams({
    client_id: settings.googleClientId,
    client_secret: settings.googleClientSecret,
    refresh_token: refreshTokenValue,
    grant_type: "refresh_token"
  });
  return asJson(await fetch("https://oauth2.googleapis.com/token", { method: "POST", body }));
}

export async function watchInbox(accessToken: string): Promise<any> {
  if (!settings.googlePubsubTopic) return {};
  return asJson(
    await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
      method: "POST",
      headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ labelIds: ["INBOX", "SENT"], topicName: settings.googlePubsubTopic })
    })
  );
}

export async function listMessages(accessToken: string, maxResults = 50, labelIds?: string[]): Promise<any[]> {
  const params = new URLSearchParams({ maxResults: String(maxResults) });
  for (const labelId of labelIds?.length ? labelIds : ["INBOX"]) params.append("labelIds", labelId);
  const payload = await asJson(
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, { headers: authHeaders(accessToken) })
  );
  return payload.messages ?? [];
}

export async function fetchMessage(accessToken: string, messageId: string): Promise<any> {
  return asJson(
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
      headers: authHeaders(accessToken)
    })
  );
}

export async function fetchAttachment(accessToken: string, messageId: string, attachmentId: string): Promise<string> {
  const payload = await asJson(
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`, {
      headers: authHeaders(accessToken)
    })
  );
  return payload.data ?? "";
}

export async function fetchHistory(accessToken: string, startHistoryId: string): Promise<any> {
  const params = new URLSearchParams({ startHistoryId, historyTypes: "messageAdded" });
  return asJson(
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/history?${params}`, { headers: authHeaders(accessToken) })
  );
}

export async function sendMessage(accessToken: string, rawBase64: string): Promise<any> {
  return asJson(
    await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ raw: rawBase64 })
    })
  );
}

import { outlookRedirect, settings } from "../config.js";

const OUTLOOK_SCOPES = [
  "https://graph.microsoft.com/Mail.ReadWrite",
  "https://graph.microsoft.com/Mail.Send",
  "https://graph.microsoft.com/User.Read",
  "offline_access"
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

export function outlookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: settings.microsoftClientId,
    response_type: "code",
    redirect_uri: outlookRedirect(),
    response_mode: "query",
    scope: OUTLOOK_SCOPES.join(" "),
    state
  });
  return `https://login.microsoftonline.com/${settings.microsoftTenantId}/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<any> {
  const body = new URLSearchParams({
    client_id: settings.microsoftClientId,
    client_secret: settings.microsoftClientSecret,
    code,
    redirect_uri: outlookRedirect(),
    grant_type: "authorization_code",
    scope: OUTLOOK_SCOPES.join(" ")
  });
  return asJson(
    await fetch(`https://login.microsoftonline.com/${settings.microsoftTenantId}/oauth2/v2.0/token`, {
      method: "POST",
      body
    })
  );
}

export async function refreshToken(refreshTokenValue: string): Promise<any> {
  const body = new URLSearchParams({
    client_id: settings.microsoftClientId,
    client_secret: settings.microsoftClientSecret,
    refresh_token: refreshTokenValue,
    grant_type: "refresh_token",
    scope: OUTLOOK_SCOPES.join(" ")
  });
  return asJson(
    await fetch(`https://login.microsoftonline.com/${settings.microsoftTenantId}/oauth2/v2.0/token`, {
      method: "POST",
      body
    })
  );
}

export async function createSubscription(accessToken: string, notificationUrl: string): Promise<any> {
  const expiresAt = new Date(Date.now() + 4_200 * 60_000).toISOString();
  return asJson(
    await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
      method: "POST",
      headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({
        changeType: "created,updated",
        notificationUrl,
        resource: "me/messages",
        expirationDateTime: expiresAt,
        clientState: "unisync"
      })
    })
  );
}

export async function listMessages(accessToken: string, top = 50): Promise<any[]> {
  const params = new URLSearchParams({ $top: String(top), $orderby: "receivedDateTime desc" });
  const payload = await asJson(
    await fetch(`https://graph.microsoft.com/v1.0/me/messages?${params}`, { headers: authHeaders(accessToken) })
  );
  return payload.value ?? [];
}

export async function fetchMessage(accessToken: string, messageId: string): Promise<any> {
  const params = new URLSearchParams({
    $expand: "attachments($select=id,name,contentType,isInline,contentId,contentBytes)"
  });
  return asJson(await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}?${params}`, { headers: authHeaders(accessToken) }));
}

export async function sendMessage(accessToken: string, message: Record<string, unknown>): Promise<any> {
  await asJson(
    await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ message, saveToSentItems: true })
    })
  );
  return { status: "sent" };
}

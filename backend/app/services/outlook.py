import httpx
from urllib.parse import urlencode
from datetime import datetime, timedelta
from app.config import settings, outlook_redirect

OUTLOOK_SCOPES = [
    "https://graph.microsoft.com/Mail.ReadWrite",
    "https://graph.microsoft.com/Mail.Send",
    "https://graph.microsoft.com/User.Read",
    "offline_access",
]


def outlook_auth_url(state: str) -> str:
    params = {
        "client_id": settings.microsoft_client_id,
        "response_type": "code",
        "redirect_uri": outlook_redirect(),
        "response_mode": "query",
        "scope": " ".join(OUTLOOK_SCOPES),
        "state": state,
    }
    return (
        f"https://login.microsoftonline.com/{settings.microsoft_tenant_id}"
        f"/oauth2/v2.0/authorize?{urlencode(params)}"
    )


async def exchange_code(code: str) -> dict:
    data = {
        "client_id": settings.microsoft_client_id,
        "client_secret": settings.microsoft_client_secret,
        "code": code,
        "redirect_uri": outlook_redirect(),
        "grant_type": "authorization_code",
        "scope": " ".join(OUTLOOK_SCOPES),
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"https://login.microsoftonline.com/{settings.microsoft_tenant_id}/oauth2/v2.0/token",
            data=data,
        )
        resp.raise_for_status()
        return resp.json()


async def refresh_token(refresh_token: str) -> dict:
    data = {
        "client_id": settings.microsoft_client_id,
        "client_secret": settings.microsoft_client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
        "scope": " ".join(OUTLOOK_SCOPES),
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"https://login.microsoftonline.com/{settings.microsoft_tenant_id}/oauth2/v2.0/token",
            data=data,
        )
        resp.raise_for_status()
        return resp.json()


async def create_subscription(access_token: str, notification_url: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    expires_at = (datetime.utcnow() + timedelta(minutes=4200)).isoformat() + "Z"
    payload = {
        "changeType": "created,updated",
        "notificationUrl": notification_url,
        "resource": "me/messages",
        "expirationDateTime": expires_at,
        "clientState": "unisync",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://graph.microsoft.com/v1.0/subscriptions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


async def list_messages(access_token: str, top: int = 50) -> list[dict]:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            "https://graph.microsoft.com/v1.0/me/messages",
            headers=headers,
            params={"$top": top, "$orderby": "receivedDateTime desc"},
        )
        resp.raise_for_status()
        return resp.json().get("value", [])


async def fetch_message(access_token: str, message_id: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"https://graph.microsoft.com/v1.0/me/messages/{message_id}",
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json()


async def send_message(access_token: str, message: dict) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://graph.microsoft.com/v1.0/me/sendMail",
            headers=headers,
            json={"message": message, "saveToSentItems": True},
        )
        resp.raise_for_status()
        return {"status": "sent"}

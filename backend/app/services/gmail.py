import httpx
from urllib.parse import urlencode
from app.config import settings, gmail_redirect

GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.labels",
    "https://www.googleapis.com/auth/calendar",
]


def gmail_auth_url(state: str) -> str:
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": gmail_redirect(),
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent",
        "scope": " ".join(GMAIL_SCOPES),
        "state": state,
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


async def exchange_code(code: str) -> dict:
    data = {
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "code": code,
        "redirect_uri": gmail_redirect(),
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post("https://oauth2.googleapis.com/token", data=data)
        resp.raise_for_status()
        return resp.json()


async def refresh_token(refresh_token: str) -> dict:
    data = {
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post("https://oauth2.googleapis.com/token", data=data)
        resp.raise_for_status()
        return resp.json()


async def watch_inbox(access_token: str) -> dict:
    if not settings.google_pubsub_topic:
        return {}
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {
        "labelIds": ["INBOX", "SENT"],
        "topicName": settings.google_pubsub_topic,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/watch",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


async def list_messages(
    access_token: str, max_results: int = 50, label_ids: list[str] | None = None
) -> list[dict]:
    headers = {"Authorization": f"Bearer {access_token}"}
    params: dict[str, object] = {"maxResults": max_results}
    if label_ids:
        params["labelIds"] = label_ids
    else:
        params["labelIds"] = "INBOX"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers=headers,
            params=params,
        )
        resp.raise_for_status()
        return resp.json().get("messages", [])


async def list_messages_page(
    access_token: str,
    max_results: int = 100,
    page_token: str | None = None,
    label_ids: list[str] | None = None,
) -> tuple[list[dict], str | None]:
    headers = {"Authorization": f"Bearer {access_token}"}
    params: dict[str, object] = {"maxResults": max_results}
    if page_token:
        params["pageToken"] = page_token
    if label_ids:
        params["labelIds"] = label_ids
    else:
        params["labelIds"] = "INBOX"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers=headers,
            params=params,
        )
        resp.raise_for_status()
        payload = resp.json()
        return payload.get("messages", []), payload.get("nextPageToken")


async def fetch_message(access_token: str, message_id: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}",
            headers=headers,
            params={"format": "full"},
        )
        resp.raise_for_status()
        return resp.json()


async def fetch_attachment(access_token: str, message_id: str, attachment_id: str) -> str:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/attachments/{attachment_id}",
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json().get("data") or ""


async def fetch_history(access_token: str, start_history_id: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/history",
            headers=headers,
            params={"startHistoryId": start_history_id, "historyTypes": "messageAdded"},
        )
        resp.raise_for_status()
        return resp.json()


async def send_message(access_token: str, raw_base64: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {"raw": raw_base64}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()

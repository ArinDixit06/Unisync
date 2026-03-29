import uuid
from app.supabase_rest import select, insert
from app.services.email import clean_html, extract_preview
from app.realtime_bus import publish_event
from app.mail_crypto import encrypt_mail_json, encrypt_mail_text
from app.services.security import sanitize_headers
from app.services.cache import bump_user_cache_version


async def store_email(user_id: str, account_id: str, message: dict) -> str:
    email_id = str(uuid.uuid4())
    body_html = clean_html(message.get("body") or "")
    preview = message.get("snippet") or extract_preview(body_html)
    safe_headers = sanitize_headers(message.get("headers") or {})

    existing = await select(
        "emails",
        "id",
        filters=[("account_id", "eq", account_id), ("message_id", "eq", message.get("message_id"))],
        use_service=True,
    )
    if existing:
        return existing[0]["id"]

    await insert(
        "emails",
        {
            "id": email_id,
            "user_id": user_id,
            "account_id": account_id,
            "provider": message.get("provider"),
            "message_id": message.get("message_id"),
            "thread_id": message.get("thread_id"),
            "subject": message.get("subject"),
            "sender_name": message.get("sender_name"),
            "sender_email": message.get("sender_email"),
            "preview_snippet": preview,
            "body_html": None,
            "body_html_enc": encrypt_mail_text(body_html),
            "received_at": message.get("received_at").isoformat() if hasattr(message.get("received_at"), "isoformat") else message.get("received_at"),
            "raw_headers": None,
            "raw_headers_enc": encrypt_mail_json(safe_headers),
        },
        use_service=True,
    )
    await publish_event(
        user_id,
        {
            "type": "email_received",
            "email_id": email_id,
            "processing_status": "pending",
        },
    )
    await bump_user_cache_version(user_id)
    return email_id

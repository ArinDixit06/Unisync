import base64
import json
from fastapi import APIRouter, Request
from app.errors import bad_request
from app.supabase_rest import select
from app.crypto import decrypt
from app.services import gmail, outlook
from app.services.email import parse_gmail_message, parse_outlook_message
from app.services.store import store_email
from app.queue import enqueue_job
from app.services.cache import bump_user_cache_version
from app.webhook_security import verify_signature

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/gmail")
async def gmail_webhook(request: Request):
    body = await request.body()
    verify_signature(body, request.headers.get("x-unisync-signature"))
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        bad_request("Invalid Gmail webhook payload")
    message = payload.get("message", {})
    data = message.get("data")
    if not data:
        return {"status": "ok"}

    try:
        decoded = base64.b64decode(data).decode("utf-8")
        event = json.loads(decoded)
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
        bad_request("Invalid Gmail webhook event")
    email_address = event.get("emailAddress")
    history_id = event.get("historyId")
    if not email_address or not history_id:
        return {"status": "ok"}

    accounts = await select(
        "linked_accounts",
        "id,user_id,access_token_enc",
        filters=[("provider", "eq", "gmail"), ("email_address", "eq", email_address)],
        use_service=True,
    )
    if not accounts:
        return {"status": "ok"}
    account = accounts[0]

    access_token = decrypt(account["access_token_enc"])
    history = await gmail.fetch_history(access_token, history_id)
    history_items = history.get("history", []) or []
    message_ids = []
    for item in history_items:
        for added in item.get("messagesAdded", []) or []:
            msg = added.get("message", {})
            if msg.get("id"):
                message_ids.append(msg["id"])

    for msg_id in message_ids:
        raw = await gmail.fetch_message(access_token, msg_id)
        parsed = await parse_gmail_message(
            raw,
            lambda attachment_id, mid=msg_id: gmail.fetch_attachment(access_token, mid, attachment_id),
        )
        parsed["provider"] = "gmail"
        email_id = await store_email(account["user_id"], account["id"], parsed)
        await enqueue_job("process_email", email_id)
        await bump_user_cache_version(account["user_id"])

    return {"status": "ok"}


@router.post("/outlook")
async def outlook_webhook(request: Request):
    body = await request.body()
    verify_signature(body, request.headers.get("x-unisync-signature"))
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        bad_request("Invalid Outlook webhook payload")
    notifications = payload.get("value", []) or []

    for note in notifications:
        if note.get("clientState") and note.get("clientState") != "unisync":
            continue
        subscription_id = note.get("subscriptionId")
        if not subscription_id:
            continue
        resource_data = note.get("resourceData", {})
        message_id = resource_data.get("id")
        if not message_id:
            continue

        accounts = await select(
            "linked_accounts",
            "id,user_id,access_token_enc",
            filters=[("provider", "eq", "outlook"), ("subscription_id", "eq", subscription_id)],
            use_service=True,
        )
        if not accounts:
            continue
        account = accounts[0]

        access_token = decrypt(account["access_token_enc"])
        raw = await outlook.fetch_message(access_token, message_id)
        parsed = parse_outlook_message(raw)
        parsed["provider"] = "outlook"
        email_id = await store_email(account["user_id"], account["id"], parsed)
        await enqueue_job("process_email", email_id)
        await bump_user_cache_version(account["user_id"])

    return {"status": "ok"}

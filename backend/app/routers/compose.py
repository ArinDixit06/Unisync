import base64
import binascii
from email.message import EmailMessage
from uuid import uuid4
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
import httpx
from app.auth import user_id_dep, user_token_dep
from app.supabase_rest import select, insert, update, delete
from app.schemas import SendEmailRequest
from app.crypto import decrypt, encrypt
from app.mail_crypto import decrypt_mail_json, decrypt_mail_text, encrypt_mail_json, encrypt_mail_text
from app.services import gmail, outlook
from app.services.email import clean_html, extract_preview
from app.services.cache import bump_user_cache_version
from app.errors import not_found, bad_request
from app.rate_limit import RateLimiter, rate_limit, user_key

_send_limiter = RateLimiter(20, "compose-send")

router = APIRouter(prefix="/compose", tags=["compose"])


def _normalize_recipients(values: list[str] | None) -> list[str]:
    if not values:
        return []
    cleaned: list[str] = []
    for item in values:
        for part in item.replace(";", ",").split(","):
            addr = part.strip()
            if addr:
                cleaned.append(addr)
    return cleaned


def _hydrate_draft(row: dict) -> dict:
    row["to_list"] = (
        decrypt_mail_json(row.get("to_list_enc"), row.get("to_list") or [])
        if "to_list_enc" in row or "to_list" in row
        else []
    )
    row["cc_list"] = (
        decrypt_mail_json(row.get("cc_list_enc"), row.get("cc_list") or [])
        if "cc_list_enc" in row or "cc_list" in row
        else []
    )
    row["bcc_list"] = (
        decrypt_mail_json(row.get("bcc_list_enc"), row.get("bcc_list") or [])
        if "bcc_list_enc" in row or "bcc_list" in row
        else []
    )
    row["subject"] = decrypt_mail_text(row.get("subject_enc")) or row.get("subject")
    row["body_html"] = decrypt_mail_text(row.get("body_html_enc")) or row.get("body_html")
    for key in ("to_list_enc", "cc_list_enc", "bcc_list_enc", "subject_enc", "body_html_enc"):
        row.pop(key, None)
    return row


def _build_email(
    req: SendEmailRequest, from_email: str, to_list: list[str], cc_list: list[str], bcc_list: list[str]
) -> EmailMessage:
    msg = EmailMessage()
    if from_email:
        msg["From"] = from_email
    msg["To"] = ", ".join(to_list)
    if cc_list:
        msg["Cc"] = ", ".join(cc_list)
    if bcc_list:
        msg["Bcc"] = ", ".join(bcc_list)
    msg["Subject"] = req.subject
    msg.set_content(req.body_html, subtype="html")

    for attachment in req.attachments or []:
        try:
            data = base64.b64decode(attachment.content_base64, validate=True)
        except (ValueError, binascii.Error):
            bad_request(f"Invalid attachment payload for {attachment.filename}")
        maintype, _, subtype = attachment.content_type.partition("/")
        msg.add_attachment(
            data,
            maintype=maintype or "application",
            subtype=subtype or "octet-stream",
            filename=attachment.filename,
        )
    return msg


@router.post("/send", dependencies=[Depends(rate_limit(_send_limiter, user_key))])
async def send_email(payload: SendEmailRequest, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    to_list = _normalize_recipients(payload.to)
    cc_list = _normalize_recipients(payload.cc)
    bcc_list = _normalize_recipients(payload.bcc)
    if not to_list and not (cc_list or bcc_list):
        bad_request("Please add at least one recipient.")
    accounts = await select(
        "linked_accounts",
        "id,provider,access_token_enc,refresh_token_enc,email_address,display_name",
        filters=[("id", "eq", payload.account_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    if not accounts:
        not_found("Linked account not found")
    account = accounts[0]

    try:
        access_token = decrypt(account["access_token_enc"])
        refresh_token = decrypt(account.get("refresh_token_enc") or "")
    except Exception:
        bad_request("Unable to decrypt account tokens. Please reconnect Gmail.")
    if not access_token:
        bad_request("Missing access token")

    message_id = None
    thread_id = None
    if account["provider"] == "gmail":
        raw = _build_email(payload, account.get("email_address") or "", to_list, cc_list, bcc_list).as_bytes()
        raw_b64 = base64.urlsafe_b64encode(raw).decode("utf-8")
        try:
            resp = await gmail.send_message(access_token, raw_b64)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (401, 403) and refresh_token:
                refreshed = await gmail.refresh_token(refresh_token)
                access_token = refreshed.get("access_token") or ""
                if not access_token:
                    bad_request("Gmail token expired. Please reconnect Gmail.")
                await update(
                    "linked_accounts",
                    {"access_token_enc": encrypt(access_token)},
                    filters=[("id", "eq", payload.account_id), ("user_id", "eq", user_id)],
                    user_token=token,
                )
                resp = await gmail.send_message(access_token, raw_b64)
            else:
                bad_request("Unable to send email. Please try again.")
        message_id = resp.get("id")
        thread_id = resp.get("threadId")
    elif account["provider"] == "outlook":
        message = {
            "subject": payload.subject,
            "body": {"contentType": "HTML", "content": payload.body_html},
            "toRecipients": [{"emailAddress": {"address": addr}} for addr in to_list],
            "ccRecipients": [{"emailAddress": {"address": addr}} for addr in cc_list],
            "bccRecipients": [{"emailAddress": {"address": addr}} for addr in bcc_list],
            "attachments": [
                {
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    "name": att.filename,
                    "contentType": att.content_type,
                    "contentBytes": att.content_base64,
                }
                for att in payload.attachments or []
            ],
        }
        await outlook.send_message(access_token, message)
    else:
        bad_request("Unknown provider")

    now_iso = datetime.now(timezone.utc).isoformat()
    body_html = payload.body_html or ""
    preview = extract_preview(clean_html(body_html))
    await insert(
        "emails",
        {
            "id": str(uuid4()),
            "user_id": user_id,
            "account_id": payload.account_id,
            "provider": account["provider"],
            "message_id": message_id or str(uuid4()),
            "thread_id": thread_id,
            "subject": payload.subject,
            "sender_name": account.get("display_name") or account.get("email_address"),
            "sender_email": account.get("email_address"),
            "preview_snippet": preview,
            "body_html": None,
            "body_html_enc": encrypt_mail_text(body_html),
            "received_at": now_iso,
            "is_read": True,
            "has_attachments": bool(payload.attachments),
            "attachment_count": len(payload.attachments or []),
            "processing_status": "done",
            "category": "primary",
        },
        use_service=True,
    )
    await bump_user_cache_version(user_id)

    return {"status": "sent"}


@router.post("/reply")
async def reply_email(payload: SendEmailRequest, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    return await send_email(payload, user_id, token)


@router.post("/forward")
async def forward_email(payload: SendEmailRequest, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    return await send_email(payload, user_id, token)


@router.get("/drafts")
async def list_drafts(user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    rows = await select(
        "drafts",
        "*",
        filters=[("user_id", "eq", user_id)],
        order="updated_at.desc",
        user_token=token,
    )
    rows = [_hydrate_draft(row) for row in rows]
    return {"drafts": rows}


@router.post("/drafts")
async def create_draft(payload: SendEmailRequest, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await insert(
        "drafts",
        {
            "user_id": user_id,
            "account_id": payload.account_id,
            "to_list": None,
            "cc_list": None,
            "bcc_list": None,
            "subject": None,
            "body_html": None,
            "to_list_enc": encrypt_mail_json(payload.to),
            "cc_list_enc": encrypt_mail_json(payload.cc or []),
            "bcc_list_enc": encrypt_mail_json(payload.bcc or []),
            "subject_enc": encrypt_mail_text(payload.subject),
            "body_html_enc": encrypt_mail_text(payload.body_html),
        },
        user_token=token,
    )
    await bump_user_cache_version(user_id)
    return {"status": "ok"}


@router.put("/drafts/{draft_id}")
async def update_draft(draft_id: str, payload: SendEmailRequest, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await update(
        "drafts",
        {
            "account_id": payload.account_id,
            "to_list": None,
            "cc_list": None,
            "bcc_list": None,
            "subject": None,
            "body_html": None,
            "to_list_enc": encrypt_mail_json(payload.to),
            "cc_list_enc": encrypt_mail_json(payload.cc or []),
            "bcc_list_enc": encrypt_mail_json(payload.bcc or []),
            "subject_enc": encrypt_mail_text(payload.subject),
            "body_html_enc": encrypt_mail_text(payload.body_html),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        filters=[("id", "eq", draft_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    await bump_user_cache_version(user_id)
    return {"status": "ok"}


@router.delete("/drafts/{draft_id}")
async def delete_draft(draft_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await delete(
        "drafts",
        filters=[("id", "eq", draft_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    await bump_user_cache_version(user_id)
    return {"status": "ok"}

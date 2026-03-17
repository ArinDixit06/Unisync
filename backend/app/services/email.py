import base64
import quopri
from bs4 import BeautifulSoup
from datetime import datetime, timezone


def _decode_part(data: str, transfer_encoding: str | None = None) -> str:
    try:
        padded = data + "=" * (-len(data) % 4)
        decoded = base64.urlsafe_b64decode(padded.encode("utf-8"))
        if transfer_encoding and "quoted-printable" in transfer_encoding.lower():
            decoded = quopri.decodestring(decoded)
        return decoded.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def _get_transfer_encoding(part: dict) -> str | None:
    for header in part.get("headers", []) or []:
        if header.get("name", "").lower() == "content-transfer-encoding":
            return header.get("value")
    return None


async def _get_part_data(part: dict, fetch_attachment) -> str:
    body = part.get("body", {}) or {}
    encoding = _get_transfer_encoding(part)
    data = body.get("data")
    if data:
        return _decode_part(data, encoding)
    attachment_id = body.get("attachmentId")
    if attachment_id and fetch_attachment:
        try:
            attachment_data = await fetch_attachment(attachment_id)
            if attachment_data:
                return _decode_part(attachment_data, encoding)
        except Exception:
            return ""
    return ""


async def _extract_gmail_body(payload: dict, fetch_attachment) -> str:
    if not payload:
        return ""
    parts = payload.get("parts", []) or []
    if parts:
        # Prefer HTML over plain text when available.
        for part in parts:
            if part.get("mimeType") == "text/html":
                data = await _get_part_data(part, fetch_attachment)
                if data:
                    return data
        for part in parts:
            if part.get("mimeType") == "text/plain":
                data = await _get_part_data(part, fetch_attachment)
                if data:
                    return data
        for part in parts:
            nested = await _extract_gmail_body(part, fetch_attachment)
            if nested:
                return nested
        return ""

    mime = payload.get("mimeType") or ""
    if "body" in payload and (mime in {"text/html", "text/plain"} or not mime):
        data = await _get_part_data(payload, fetch_attachment)
        if data:
            return data
    return ""


async def parse_gmail_message(message: dict, fetch_attachment) -> dict:
    payload = message.get("payload", {})
    headers = payload.get("headers", []) or []
    header_map = {h["name"].lower(): h["value"] for h in headers if "name" in h}
    body = await _extract_gmail_body(payload, fetch_attachment)
    subject = header_map.get("subject")
    sender = header_map.get("from", "")
    sender_email = sender.split("<")[-1].replace(">", "").strip() if sender else ""
    sender_name = sender.split("<")[0].strip() if "<" in sender else sender
    internal_date = message.get("internalDate")
    received_at = None
    if internal_date:
        try:
            received_at = datetime.fromtimestamp(int(internal_date) / 1000, tz=timezone.utc)
        except Exception:
            received_at = None
    return {
        "message_id": message.get("id"),
        "thread_id": message.get("threadId"),
        "subject": subject,
        "sender_name": sender_name,
        "sender_email": sender_email,
        "received_at": received_at,
        "snippet": message.get("snippet"),
        "body": body,
        "headers": header_map,
    }


def parse_outlook_message(message: dict) -> dict:
    sender = message.get("from", {}).get("emailAddress", {})
    return {
        "message_id": message.get("id"),
        "thread_id": message.get("conversationId"),
        "subject": message.get("subject"),
        "sender_name": sender.get("name"),
        "sender_email": sender.get("address", ""),
        "received_at": message.get("receivedDateTime"),
        "snippet": message.get("bodyPreview"),
        "body": message.get("body", {}).get("content", ""),
        "headers": {},
    }


def clean_html(html: str) -> str:
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    for script in soup(["script"]):
        script.decompose()
    return str(soup)


def extract_preview(text: str, max_len: int = 200) -> str:
    if not text:
        return ""
    stripped = " ".join(text.split())
    return stripped[:max_len]

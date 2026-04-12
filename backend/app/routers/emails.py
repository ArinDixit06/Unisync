from fastapi import APIRouter, Depends, Query
from datetime import datetime
import re
from bs4 import BeautifulSoup
import dateparser
from dateparser.search import search_dates
from app.auth import user_id_dep, user_token_dep
from app.supabase_rest import select, update, insert
from app.schemas import EmailUpdate, SnoozeRequest
from app.errors import not_found
from app.rate_limit import RateLimiter, rate_limit, user_key
from app.mail_crypto import decrypt_mail_json, decrypt_mail_text
from app.services.cache import bump_user_cache_version, get_cached_json, get_user_cache_version, set_cached_json

_email_limiter = RateLimiter(120, "emails")

router = APIRouter(prefix="/emails", tags=["emails"], dependencies=[Depends(rate_limit(_email_limiter, user_key))])


def _parse_cursor(cursor: str | None):
    if not cursor:
        return None, None
    if "|" in cursor:
        ts, eid = cursor.split("|", 1)
        try:
            return datetime.fromisoformat(ts), eid
        except ValueError:
            return None, None
    try:
        return datetime.fromisoformat(cursor), None
    except ValueError:
        return None, None


def _strip_html(html: str) -> str:
    if not html:
        return ""
    return BeautifulSoup(html, "html.parser").get_text(" ", strip=True)


def _hydrate_email(row: dict) -> dict:
    row["body_html"] = decrypt_mail_text(row.get("body_html_enc")) or row.get("body_html") or ""
    row["raw_headers"] = decrypt_mail_json(row.get("raw_headers_enc"), row.get("raw_headers") or {})
    row.pop("body_html_enc", None)
    row.pop("raw_headers_enc", None)
    return row


def _mail_sort_order(filter_value: str | None, category: str | None) -> str:
    if filter_value in {"trash", "sent"}:
        return "received_at.desc"
    if filter_value == "high_risk":
        return "risk_level.desc.nullslast,priority_level.desc.nullslast,received_at.desc"
    if filter_value == "unread":
        return "priority_level.desc.nullslast,risk_level.desc.nullslast,is_read.asc,received_at.desc"
    if category == "primary" or not filter_value:
        return "priority_level.desc.nullslast,risk_level.desc.nullslast,received_at.desc"
    return "received_at.desc"


def _detect_event(body_html: str, subject: str | None):
    text = _strip_html(body_html)[:4000]
    if not text:
        return None
    matches = search_dates(
        text,
        settings={
            "PREFER_DATES_FROM": "future",
            "RETURN_AS_TIMEZONE_AWARE": True,
        },
    )
    if not matches:
        return None
    label, dt = matches[0]
    if not dt:
        return None

    # If date was detected but time is missing (00:00), try to infer time from the body.
    if dt.hour == 0 and dt.minute == 0:
        time_match = re.search(r"\b([01]?\d|2[0-3])(?::([0-5]\d))?\s*(am|pm)?\b", text, re.IGNORECASE)
        if time_match:
            time_str = time_match.group(0)
            parsed_time = dateparser.parse(
                time_str,
                settings={
                    "RETURN_AS_TIMEZONE_AWARE": True,
                },
            )
            if parsed_time:
                dt = dt.replace(hour=parsed_time.hour, minute=parsed_time.minute, second=0, microsecond=0)

    return {
        "title": subject or "Event",
        "start_datetime": dt.isoformat(),
        "end_datetime": None,
        "location": None,
        "description": label,
    }


@router.get("")
async def list_emails(
    user_id: str = Depends(user_id_dep),
    token: str = Depends(user_token_dep),
    account_id: str | None = None,
    category: str | None = None,
    filter: str | None = None,
    label_id: str | None = None,
    cursor: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, le=100),
):
    cache_version = await get_user_cache_version(user_id)
    cache_payload = {
        "user_id": user_id,
        "account_id": account_id,
        "category": category,
        "filter": filter,
        "label_id": label_id,
        "cursor": cursor,
        "offset": offset,
        "limit": limit,
        "version": cache_version,
    }
    cached = await get_cached_json("emails:list", cache_payload)
    if cached is not None:
        return cached

    filters: list[tuple[str, str, str]] = [("user_id", "eq", user_id)]

    # Fetch the user's connected account emails once — these are the user's own addresses.
    # Rule: emails FROM these addresses belong exclusively in the Sent folder.
    all_linked = await select(
        "linked_accounts",
        "email_address,id",
        filters=[("user_id", "eq", user_id)],
        user_token=token,
    )
    # If viewing a specific account, scope to that account's address only.
    scoped_accounts = [acc for acc in all_linked if acc.get("id") == account_id] if account_id else all_linked
    my_emails = [acc["email_address"] for acc in scoped_accounts if acc.get("email_address")]

    if account_id:
        filters.append(("account_id", "eq", account_id))
    if category:
        filters.append(("category", "eq", category))
    if filter == "trash":
        filters.append(("is_deleted", "eq", "true"))
    else:
        filters.append(("is_deleted", "eq", "false"))
        filters.append(("is_archived", "eq", "false"))

    if filter == "sent":
        # Sent: only emails whose sender is one of the user's own connected addresses.
        if not my_emails:
            return {"emails": []}
        quoted = ",".join(f'"{e}"' for e in my_emails)
        filters.append(("sender_email", "in", f"({quoted})"))
    else:
        # Every other filter (All, Unread, Starred, Snoozed, High-Risk, Trash):
        # exclude emails sent FROM the user's own addresses so they stay in Sent only.
        if my_emails:
            quoted = ",".join(f'"{e}"' for e in my_emails)
            filters.append(("sender_email", "not.in", f"({quoted})"))

        if filter == "unread":
            filters.append(("is_read", "eq", "false"))
        elif filter == "starred":
            filters.append(("is_starred", "eq", "true"))
        elif filter == "high_risk":
            filters.append(("risk_level", "eq", "high"))
        elif filter == "snoozed":
            filters.append(("is_snoozed", "eq", "true"))

    if label_id:
        label_rows = await select(
            "email_labels",
            "email_id",
            filters=[("label_id", "eq", label_id)],
            user_token=token,
        )
        email_ids = [row["email_id"] for row in label_rows]
        if not email_ids:
            return {"emails": []}
        filters.append(("id", "in", f"({','.join(email_ids)})"))

    cursor_ts, _ = _parse_cursor(cursor)
    if cursor_ts:
        filters.append(("received_at", "lt", cursor_ts.isoformat()))

    rows = await select(
        "emails",
        "id,thread_id,subject,sender_name,sender_email,preview_snippet,received_at,is_read,is_starred,is_archived,"
        "is_snoozed,snoozed_until,has_attachments,processing_status,risk_level,priority_level,category,account_id,"
        "linked_accounts(provider,email_address)",
        filters=filters,
        order=_mail_sort_order(filter, category),
        limit=limit,
        offset=offset,
        user_token=token,
    )
    emails = []
    for row in rows:
        account = row.pop("linked_accounts", None) or {}
        row["provider"] = account.get("provider")
        row["account_email"] = account.get("email_address")
        emails.append(row)
    next_offset = offset + len(emails) if len(emails) == limit else None
    response = {"emails": emails, "next_offset": next_offset}
    await set_cached_json("emails:list", cache_payload, response, ttl_seconds=15)
    return response


@router.get("/{email_id}")
async def get_email(email_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    rows = await select(
        "emails",
        "*,linked_accounts(provider,email_address)",
        filters=[("id", "eq", email_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    if not rows:
        not_found("Email not found")
    result = rows[0]
    result = _hydrate_email(result)
    account = result.pop("linked_accounts", None) or {}
    result["provider"] = account.get("provider")
    result["account_email"] = account.get("email_address")

    all_events = await select(
        "suggested_events",
        "*",
        filters=[("email_id", "eq", email_id), ("user_id", "eq", user_id)],
        order="created_at.desc",
        user_token=token,
    )

    if not all_events:
        detected = _detect_event(result.get("body_html") or "", result.get("subject"))
        if detected:
            created = await insert(
                "suggested_events",
                {
                    "email_id": email_id,
                    "user_id": user_id,
                    **detected,
                },
                user_token=token,
                returning=True,
            )
            if isinstance(created, list):
                all_events = created
            elif created:
                all_events = [created]

    active_events = [event for event in all_events if event.get("dismissed_at") is None]
    if active_events:
        current = active_events[0]
        start_value = current.get("start_datetime")
        parsed_start = None
        if isinstance(start_value, str):
            try:
                parsed_start = datetime.fromisoformat(start_value.replace("Z", "+00:00"))
            except ValueError:
                parsed_start = None
        if parsed_start and parsed_start.hour == 0 and parsed_start.minute == 0:
            detected = _detect_event(result.get("body_html") or "", result.get("subject"))
            if detected and detected.get("start_datetime"):
                await update(
                    "suggested_events",
                    {"start_datetime": detected["start_datetime"], "description": detected.get("description")},
                    filters=[("id", "eq", current.get("id")), ("user_id", "eq", user_id)],
                    user_token=token,
                )
                current["start_datetime"] = detected["start_datetime"]
    for event in active_events:
        if event.get("start_datetime") and not event.get("starts_at"):
            event["starts_at"] = event["start_datetime"]

    result["suggested_events"] = active_events
    return result


@router.patch("/{email_id}")
async def update_email(email_id: str, payload: EmailUpdate, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    values = {}
    if payload.is_read is not None:
        values["is_read"] = payload.is_read
    if payload.is_starred is not None:
        values["is_starred"] = payload.is_starred
    if payload.is_archived is not None:
        values["is_archived"] = payload.is_archived
    if not values:
        return {"status": "ok"}
    await update(
        "emails",
        values,
        filters=[("id", "eq", email_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    await bump_user_cache_version(user_id)
    return {"status": "ok"}


@router.delete("/{email_id}")
async def delete_email(email_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await update(
        "emails",
        {"is_deleted": True},
        filters=[("id", "eq", email_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    await bump_user_cache_version(user_id)
    return {"status": "ok"}


@router.post("/{email_id}/snooze")
async def snooze_email(email_id: str, payload: SnoozeRequest, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await update(
        "emails",
        {"is_snoozed": True, "snoozed_until": payload.snoozed_until.isoformat()},
        filters=[("id", "eq", email_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    await bump_user_cache_version(user_id)
    return {"status": "ok"}


@router.delete("/{email_id}/snooze")
async def unsnooze_email(email_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await update(
        "emails",
        {"is_snoozed": False, "snoozed_until": None},
        filters=[("id", "eq", email_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    await bump_user_cache_version(user_id)
    return {"status": "ok"}


@router.get("/thread/{thread_id}")
async def get_thread(thread_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    rows = await select(
        "emails",
        "*",
        filters=[("thread_id", "eq", thread_id), ("user_id", "eq", user_id)],
        order="received_at.asc",
        user_token=token,
    )
    return {"emails": [_hydrate_email(row) for row in rows]}

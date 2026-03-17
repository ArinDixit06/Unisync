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

_email_limiter = RateLimiter(120, "emails")

router = APIRouter(prefix="/emails", tags=["emails"], dependencies=[Depends(rate_limit(_email_limiter, user_key))])


def _parse_cursor(cursor: str | None):
    if not cursor:
        return None, None
    if "|" in cursor:
        ts, eid = cursor.split("|", 1)
        return datetime.fromisoformat(ts), eid
    return datetime.fromisoformat(cursor), None




def _strip_html(html: str) -> str:
    if not html:
        return ""
    return BeautifulSoup(html, "html.parser").get_text(" ", strip=True)


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
    limit: int = Query(default=50, le=100),
):
    filters: list[tuple[str, str, str]] = [("user_id", "eq", user_id)]

    if account_id:
        filters.append(("account_id", "eq", account_id))
    if category:
        filters.append(("category", "eq", category))
    if filter == "trash":
        filters.append(("is_deleted", "eq", "true"))
    else:
        filters.append(("is_deleted", "eq", "false"))
        filters.append(("is_archived", "eq", "false"))

    if filter == "unread":
        filters.append(("is_read", "eq", "false"))
    elif filter == "starred":
        filters.append(("is_starred", "eq", "true"))
    elif filter == "high_risk":
        filters.append(("risk_level", "eq", "high"))
    elif filter == "snoozed":
        filters.append(("is_snoozed", "eq", "true"))
    elif filter == "sent":
        accounts = await select(
            "linked_accounts",
            "email_address,id",
            filters=[("user_id", "eq", user_id)],
            user_token=token,
        )
        if account_id:
            accounts = [acc for acc in accounts if acc.get("id") == account_id]
        account_emails = [acc.get("email_address") for acc in accounts if acc.get("email_address")]
        if not account_emails:
            return {"emails": []}
        quoted = ",".join(f'"{email}"' for email in account_emails)
        filters.append(("sender_email", "in", f"({quoted})"))

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
        order="received_at.desc",
        limit=limit,
        user_token=token,
    )
    emails = []
    for row in rows:
        account = row.pop("linked_accounts", None) or {}
        row["provider"] = account.get("provider")
        row["account_email"] = account.get("email_address")
        emails.append(row)
    return {"emails": emails}


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
    fields = []
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
    return {"status": "ok"}


@router.delete("/{email_id}")
async def delete_email(email_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await update(
        "emails",
        {"is_deleted": True},
        filters=[("id", "eq", email_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    return {"status": "ok"}


@router.post("/{email_id}/snooze")
async def snooze_email(email_id: str, payload: SnoozeRequest, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await update(
        "emails",
        {"is_snoozed": True, "snoozed_until": payload.snoozed_until.isoformat()},
        filters=[("id", "eq", email_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    return {"status": "ok"}


@router.delete("/{email_id}/snooze")
async def unsnooze_email(email_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await update(
        "emails",
        {"is_snoozed": False, "snoozed_until": None},
        filters=[("id", "eq", email_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
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
    return {"emails": rows}

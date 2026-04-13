import httpx

from fastapi import APIRouter, Depends, Query

from app.auth import user_id_dep, user_token_dep
from app.errors import bad_request
from app.supabase_rest import select
from app.services.cache import get_cached_json, get_user_cache_version, set_cached_json

router = APIRouter(prefix="/search", tags=["search"])


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


@router.get("")
async def search(
    q: str,
    limit: int = Query(default=20, ge=1, le=100),
    account_id: str | None = None,
    category: str | None = None,
    filter: str | None = None,
    label_id: str | None = None,
    cursor: str | None = None,
    offset: int = Query(default=0, ge=0),
    user_id: str = Depends(user_id_dep),
    token: str = Depends(user_token_dep),
):
    normalized_q = " ".join(q.split())
    if not normalized_q:
        bad_request("Search query is required")

    cache_payload = {
        "user_id": user_id,
        "q": normalized_q.lower(),
        "limit": limit,
        "account_id": account_id,
        "category": category,
        "filter": filter,
        "label_id": label_id,
        "cursor": cursor,
        "offset": offset,
        "version": await get_user_cache_version(user_id),
    }
    cached = await get_cached_json("emails:search", cache_payload)
    if cached is not None:
        return cached

    filters: list[tuple[str, str, str]] = [("user_id", "eq", user_id)]

    all_linked = await select(
        "linked_accounts",
        "email_address,id",
        filters=[("user_id", "eq", user_id)],
        user_token=token,
    )
    scoped_accounts = [acc for acc in all_linked if acc.get("id") == account_id] if account_id else all_linked
    my_emails = [acc["email_address"] for acc in scoped_accounts if acc.get("email_address")]

    if account_id:
        filters.append(("account_id", "eq", account_id))
    if category and filter not in {"sent", "drafts", "trash"}:
        filters.append(("category", "eq", category))
    if filter == "trash":
        filters.append(("is_deleted", "eq", "true"))
    else:
        filters.append(("is_deleted", "eq", "false"))
        filters.append(("is_archived", "eq", "false"))

    if filter == "sent":
        if not my_emails:
            return {"emails": []}
        quoted = ",".join(f'"{e}"' for e in my_emails)
        filters.append(("sender_email", "in", f"({quoted})"))
    else:
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

    try:
        rows = await select(
            "emails",
            "id,thread_id,subject,sender_name,sender_email,preview_snippet,received_at,is_read,is_starred,is_archived,"
            "is_snoozed,snoozed_until,has_attachments,processing_status,risk_level,priority_level,category,account_id,"
            "linked_accounts(provider,email_address)",
            filters=filters + [("search_vector", "fts", f"english.{normalized_q}")],
            order=_mail_sort_order(filter, category),
            limit=limit,
            offset=offset,
            user_token=token,
        )
    except httpx.HTTPStatusError as exc:
        detail = f"Search backend returned {exc.response.status_code}"
        if exc.response.text:
            detail = f"{detail}: {exc.response.text[:160]}"
        bad_request("Search is temporarily unavailable", {"detail": detail})
    except httpx.HTTPError as exc:
        bad_request("Search is temporarily unavailable", {"detail": str(exc)})

    emails = []
    for row in rows:
        account = row.pop("linked_accounts", None) or {}
        row["provider"] = account.get("provider")
        row["account_email"] = account.get("email_address")
        emails.append(row)
    response = {"emails": emails}
    await set_cached_json("emails:search", cache_payload, response, ttl_seconds=20)
    return response

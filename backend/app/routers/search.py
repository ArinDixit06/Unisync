import httpx

from fastapi import APIRouter, Depends
from app.auth import user_id_dep, user_token_dep
from app.errors import bad_request
from app.supabase_rest import select
from app.services.cache import get_cached_json, get_user_cache_version, set_cached_json

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search(q: str, limit: int = 20, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    normalized_q = " ".join(q.split())
    if not normalized_q:
        bad_request("Search query is required")
    if limit < 1 or limit > 100:
        bad_request("Search limit must be between 1 and 100")
    cache_payload = {
        "user_id": user_id,
        "q": normalized_q.lower(),
        "limit": limit,
        "version": await get_user_cache_version(user_id),
    }
    cached = await get_cached_json("emails:search", cache_payload)
    if cached is not None:
        return cached

    try:
        rows = await select(
            "emails",
            "id,thread_id,subject,sender_name,sender_email,preview_snippet,received_at,is_read,is_starred,is_archived,"
            "is_snoozed,snoozed_until,has_attachments,processing_status,risk_level,priority_level,category,account_id,"
            "linked_accounts(provider,email_address)",
            filters=[("user_id", "eq", user_id), ("search_vector", "fts", f"english.{normalized_q}")],
            order="priority_level.desc.nullslast,risk_level.desc.nullslast,received_at.desc",
            limit=limit,
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

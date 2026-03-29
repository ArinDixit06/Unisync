from fastapi import APIRouter, Depends
from app.auth import user_id_dep, user_token_dep
from app.supabase_rest import select
from app.services.cache import get_cached_json, get_user_cache_version, set_cached_json

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search(q: str, limit: int = 20, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    normalized_q = " ".join(q.split())
    cache_payload = {
        "user_id": user_id,
        "q": normalized_q.lower(),
        "limit": limit,
        "version": await get_user_cache_version(user_id),
    }
    cached = await get_cached_json("emails:search", cache_payload)
    if cached is not None:
        return cached

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
    emails = []
    for row in rows:
        account = row.pop("linked_accounts", None) or {}
        row["provider"] = account.get("provider")
        row["account_email"] = account.get("email_address")
        emails.append(row)
    response = {"emails": emails}
    await set_cached_json("emails:search", cache_payload, response, ttl_seconds=20)
    return response

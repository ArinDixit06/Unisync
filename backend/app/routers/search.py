from fastapi import APIRouter, Depends
from app.auth import user_id_dep, user_token_dep
from app.supabase_rest import select

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search(q: str, limit: int = 20, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    rows = await select(
        "emails",
        "id,thread_id,subject,sender_name,sender_email,preview_snippet,received_at,is_read,is_starred,is_archived,"
        "is_snoozed,snoozed_until,has_attachments,processing_status,risk_level,priority_level,category,account_id,"
        "linked_accounts(provider,email_address)",
        filters=[("user_id", "eq", user_id), ("search_vector", "fts", f"english.{q}")],
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

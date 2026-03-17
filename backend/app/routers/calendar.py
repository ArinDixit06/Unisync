from fastapi import APIRouter, Depends
import httpx
from app.auth import user_id_dep, user_token_dep
from app.supabase_rest import select, update
from app.crypto import decrypt, encrypt
from app.errors import not_found, bad_request
from app.services.calendar import create_event
from app.services import gmail
from datetime import datetime, timezone

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.post("/events/{event_id}/confirm")
async def confirm_event(event_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    events = await select(
        "suggested_events",
        "*",
        filters=[("id", "eq", event_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    if not events:
        not_found("Suggested event not found")
    event = events[0]
    start_dt = event.get("start_datetime")
    if isinstance(start_dt, str):
        try:
            start_dt = datetime.fromisoformat(start_dt.replace("Z", "+00:00"))
        except ValueError:
            start_dt = None
    if not start_dt:
        bad_request("Event date missing")

    accounts = await select(
        "linked_accounts",
        "id,access_token_enc,refresh_token_enc",
        filters=[("user_id", "eq", user_id), ("provider", "eq", "gmail")],
        order="created_at.desc",
        limit=1,
        user_token=token,
    )
    if not accounts:
        bad_request("No Gmail account linked for calendar sync")

    account = accounts[0]
    access_token = decrypt(account["access_token_enc"])
    refresh_token = decrypt(account.get("refresh_token_enc") or "")
    end_dt = event.get("end_datetime")
    if isinstance(end_dt, str):
        try:
            end_dt = datetime.fromisoformat(end_dt.replace("Z", "+00:00"))
        except ValueError:
            end_dt = None

    try:
        result = await create_event(
            access_token,
            event["title"],
            start_dt.isoformat(),
            end_dt.isoformat() if end_dt else None,
            event["location"],
            event["description"],
        )
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status in (401, 403) and refresh_token:
            tokens = await gmail.refresh_token(refresh_token)
            new_access = tokens.get("access_token")
            if not new_access:
                bad_request("Unable to refresh Gmail token for calendar access")
            await update(
                "linked_accounts",
                {"access_token_enc": encrypt(new_access)},
                filters=[("id", "eq", account["id"])],
                user_token=token,
            )
            try:
                result = await create_event(
                    new_access,
                    event["title"],
                    start_dt.isoformat(),
                    end_dt.isoformat() if end_dt else None,
                    event["location"],
                    event["description"],
                )
            except httpx.HTTPStatusError as exc2:
                detail = exc2.response.text
                try:
                    detail_json = exc2.response.json()
                    detail = detail_json.get("error", {}).get("message") or detail_json.get("error_description") or detail
                except Exception:
                    pass
                bad_request(f"Calendar error: {detail}")
        else:
            detail = exc.response.text
            try:
                detail_json = exc.response.json()
                detail = detail_json.get("error", {}).get("message") or detail_json.get("error_description") or detail
            except Exception:
                pass
            bad_request(f"Calendar error: {detail}")
    except httpx.HTTPError as exc:
        bad_request(f"Calendar error: {str(exc)}")
    await update(
        "suggested_events",
        {"confirmed_at": datetime.now(timezone.utc).isoformat(), "gcal_event_id": result.get("id")},
        filters=[("id", "eq", event_id)],
        user_token=token,
    )
    return {"status": "ok", "event_id": result.get("id")}


@router.delete("/events/{event_id}")
async def dismiss_event(event_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await update(
        "suggested_events",
        {"dismissed_at": datetime.now(timezone.utc).isoformat()},
        filters=[("id", "eq", event_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    return {"status": "ok"}

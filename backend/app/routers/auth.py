from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from uuid import uuid4
from datetime import datetime, timedelta
import httpx
from app.auth import user_id_dep, user_token_dep
from app.supabase_rest import insert, select, delete
from app.crypto import encrypt
from app.services import gmail, outlook
from app.errors import bad_request, not_found
from app.rate_limit import RateLimiter, rate_limit, ip_key
from app.config import settings

_auth_limiter = RateLimiter(10, "auth")

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    dependencies=[Depends(rate_limit(_auth_limiter, ip_key))],
)


async def _store_state(user_id: str, provider: str) -> str:
    state = str(uuid4())
    await insert(
        "oauth_states",
        {
            "id": state,
            "user_id": user_id,
            "provider": provider,
            "expires_at": (datetime.utcnow() + timedelta(minutes=15)).isoformat(),
        },
        use_service=True,
    )
    return state


async def _consume_state(state: str, provider: str) -> str:
    rows = await select(
        "oauth_states",
        "user_id",
        filters=[
            ("id", "eq", state),
            ("provider", "eq", provider),
            ("expires_at", "gt", datetime.utcnow().isoformat()),
        ],
        use_service=True,
    )
    if not rows:
        bad_request("Invalid OAuth state")
    await delete(
        "oauth_states",
        filters=[("id", "eq", state)],
        use_service=True,
    )
    return rows[0]["user_id"]


@router.post("/link/gmail")
async def link_gmail(user_id: str = Depends(user_id_dep)):
    state = await _store_state(user_id, "gmail")
    return {"auth_url": gmail.gmail_auth_url(state)}


@router.get("/callback/gmail")
async def callback_gmail(code: str, state: str):
    user_id = await _consume_state(state, "gmail")
    tokens = await gmail.exchange_code(code)
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    if not access_token:
        bad_request("Missing access token")

    async with httpx.AsyncClient(timeout=15) as client:
        info = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/profile",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        info.raise_for_status()
        profile = info.json()

    account_id = str(uuid4())
    await insert(
        "linked_accounts",
        {
            "id": account_id,
            "user_id": user_id,
            "provider": "gmail",
            "email_address": profile.get("emailAddress"),
            "access_token_enc": encrypt(access_token),
            "refresh_token_enc": encrypt(refresh_token or ""),
        },
        use_service=True,
    )
    await gmail.watch_inbox(access_token)
    redirect_url = f"{settings.frontend_url}/?linked=gmail&account_id={account_id}"
    return RedirectResponse(url=redirect_url)


@router.post("/link/outlook")
async def link_outlook(user_id: str = Depends(user_id_dep)):
    state = await _store_state(user_id, "outlook")
    return {"auth_url": outlook.outlook_auth_url(state)}


@router.get("/callback/outlook")
async def callback_outlook(code: str, state: str):
    user_id = await _consume_state(state, "outlook")
    tokens = await outlook.exchange_code(code)
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    if not access_token:
        bad_request("Missing access token")

    async with httpx.AsyncClient(timeout=15) as client:
        info = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        info.raise_for_status()
        profile = info.json()

    subscription = await outlook.create_subscription(
        access_token, f"{settings.api_base_url}/webhooks/outlook"
    )

    account_id = str(uuid4())
    await insert(
        "linked_accounts",
        {
            "id": account_id,
            "user_id": user_id,
            "provider": "outlook",
            "email_address": profile.get("mail") or profile.get("userPrincipalName"),
            "access_token_enc": encrypt(access_token),
            "refresh_token_enc": encrypt(refresh_token or ""),
            "subscription_id": subscription.get("id"),
            "subscription_expires_at": subscription.get("expirationDateTime"),
        },
        use_service=True,
    )
    redirect_url = f"{settings.frontend_url}/?linked=outlook&account_id={account_id}"
    return RedirectResponse(url=redirect_url)


@router.post("/callback/google")
async def callback_google(code: str, state: str):
    return await callback_gmail(code=code, state=state)


@router.get("/accounts")
async def list_accounts(user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    rows = await select(
        "linked_accounts",
        "id,provider,email_address,display_name,created_at",
        filters=[("user_id", "eq", user_id)],
        user_token=token,
    )
    return {"accounts": [dict(row) for row in rows]}


@router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    rows = await select(
        "linked_accounts",
        "id",
        filters=[("id", "eq", account_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    if not rows:
        not_found("Account not found")
    await delete(
        "linked_accounts",
        filters=[("id", "eq", account_id)],
        user_token=token,
    )
    return {"status": "ok"}

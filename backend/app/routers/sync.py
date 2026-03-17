from fastapi import APIRouter, Depends
from app.auth import user_id_dep, user_token_dep
from app.supabase_rest import select
from app.crypto import decrypt
from app.services import gmail, outlook
from app.services.email import parse_gmail_message, parse_outlook_message
from app.services.store import store_email
from app.queue import enqueue_job
from app.errors import not_found

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/account/{account_id}")
async def sync_account(account_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    accounts = await select(
        "linked_accounts",
        "id,provider,access_token_enc",
        filters=[("id", "eq", account_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    if not accounts:
        not_found("Account not found")
    account = accounts[0]

    access_token = decrypt(account["access_token_enc"])
    stored = 0
    if account["provider"] == "gmail":
        inbox = await gmail.list_messages(access_token, label_ids=["INBOX"])
        sent = await gmail.list_messages(access_token, label_ids=["SENT"])
        seen = set()
        for msg in inbox + sent:
            msg_id = msg.get("id")
            if not msg_id or msg_id in seen:
                continue
            seen.add(msg_id)
            raw = await gmail.fetch_message(access_token, msg_id)
            parsed = await parse_gmail_message(
                raw,
                lambda attachment_id, mid=msg_id: gmail.fetch_attachment(access_token, mid, attachment_id),
            )
            parsed["provider"] = "gmail"
            email_id = await store_email(user_id, account_id, parsed)
            await enqueue_job("process_email", email_id)
            stored += 1
    else:
        messages = await outlook.list_messages(access_token)
        for msg in messages:
            parsed = parse_outlook_message(msg)
            parsed["provider"] = "outlook"
            email_id = await store_email(user_id, account_id, parsed)
            await enqueue_job("process_email", email_id)
            stored += 1

    return {"status": "ok", "count": stored}

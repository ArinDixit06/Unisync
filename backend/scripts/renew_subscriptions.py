import asyncio
from app.db import init_db, fetch_all, execute
from app.crypto import decrypt
from app.services import gmail, outlook
from app.config import settings


async def main():
    await init_db()
    accounts = await fetch_all("SELECT id, provider, refresh_token_enc FROM linked_accounts")
    for account in accounts:
        refresh_token = decrypt(account["refresh_token_enc"])
        if not refresh_token:
            continue
        if account["provider"] == "gmail":
            tokens = await gmail.refresh_token(refresh_token)
            access_token = tokens.get("access_token")
            if access_token:
                await gmail.watch_inbox(access_token)
        elif account["provider"] == "outlook":
            tokens = await outlook.refresh_token(refresh_token)
            access_token = tokens.get("access_token")
            if access_token:
                subscription = await outlook.create_subscription(
                    access_token, f"{settings.api_base_url}/webhooks/outlook"
                )
                await execute(
                    "UPDATE linked_accounts SET subscription_id=$1, subscription_expires_at=$2 WHERE id=$3",
                    subscription.get("id"),
                    subscription.get("expirationDateTime"),
                    account["id"],
                )


if __name__ == "__main__":
    asyncio.run(main())

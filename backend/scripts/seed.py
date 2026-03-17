import asyncio
import uuid
from datetime import datetime, timedelta
import asyncpg
import os


async def main():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL is required")

    conn = await asyncpg.connect(database_url)
    user_id = str(uuid.uuid4())
    await conn.execute(
        "INSERT INTO users (id, email, display_name) VALUES ($1,$2,$3)",
        user_id,
        "student@example.edu",
        "Student",
    )

    account_id = str(uuid.uuid4())
    await conn.execute(
        "INSERT INTO linked_accounts (id, user_id, provider, email_address, access_token_enc, refresh_token_enc) "
        "VALUES ($1,$2,$3,$4,$5,$6)",
        account_id,
        user_id,
        "gmail",
        "student@example.edu",
        "",
        "",
    )

    for i in range(1, 6):
        await conn.execute(
            "INSERT INTO emails (id, user_id, account_id, provider, message_id, thread_id, subject, sender_name, sender_email, "
            "preview_snippet, body_html, received_at, is_read, processing_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
            str(uuid.uuid4()),
            user_id,
            account_id,
            "gmail",
            f"seed-{i}",
            f"thread-{i}",
            f"Welcome to UniSync {i}",
            "Advisor",
            "advisor@university.edu",
            "This is a seeded email for demo purposes.",
            "<p>This is a seeded email for demo purposes.</p>",
            datetime.utcnow() - timedelta(hours=i),
            False,
            "done",
        )

    await conn.close()
    print("Seeded sample data for user", user_id)


if __name__ == "__main__":
    asyncio.run(main())

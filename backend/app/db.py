import asyncpg
from app.config import settings

_pool: asyncpg.Pool | None = None


async def init_db() -> asyncpg.Pool:
    global _pool
    if not settings.use_db:
        return None
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is required when USE_DB=true")
    if _pool is None:
        _pool = await asyncpg.create_pool(
            settings.database_url, min_size=5, max_size=20
        )
    return _pool


async def get_pool() -> asyncpg.Pool:
    if not settings.use_db:
        return None
    if _pool is None:
        return await init_db()
    return _pool


async def close_db() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def fetch_one(query: str, *args):
    if not settings.use_db:
        return None
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(query, *args)


async def fetch_all(query: str, *args):
    if not settings.use_db:
        return []
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(query, *args)


async def execute(query: str, *args):
    if not settings.use_db:
        return "DB_DISABLED"
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.execute(query, *args)


async def execute_many(query: str, args_list):
    if not settings.use_db:
        return "DB_DISABLED"
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            for args in args_list:
                await conn.execute(query, *args)

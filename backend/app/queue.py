from arq import create_pool
from arq.connections import RedisSettings, ArqRedis
from app.config import settings
from app.services.cache import bump_user_cache_version

_redis: ArqRedis | None = None


async def get_redis() -> ArqRedis:
    global _redis
    if _redis is None:
        if not settings.use_redis or not settings.redis_url:
            raise RuntimeError("Redis disabled")
        _redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    return _redis


async def enqueue_job(name: str, *args, **kwargs):
    if not settings.use_redis or not settings.redis_url:
        if name == "process_email":
            from app.workers.tasks import process_email

            result = await process_email(None, *args, **kwargs)
            if args:
                await _refresh_user_cache_for_email(args[0])
            return result
        return None
    redis = await get_redis()
    return await redis.enqueue_job(name, *args, **kwargs)


async def _refresh_user_cache_for_email(email_id: str) -> None:
    from app.supabase_rest import select

    rows = await select("emails", "user_id", filters=[("id", "eq", email_id)], use_service=True)
    if rows and rows[0].get("user_id"):
        await bump_user_cache_version(rows[0]["user_id"])

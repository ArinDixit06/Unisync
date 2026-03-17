from arq import create_pool
from arq.connections import RedisSettings, ArqRedis
from app.config import settings

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

            return await process_email(None, *args, **kwargs)
        return None
    redis = await get_redis()
    return await redis.enqueue_job(name, *args, **kwargs)

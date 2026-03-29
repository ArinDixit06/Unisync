import hashlib
import json
import time
from typing import Any

from redis.asyncio import Redis

from app.config import settings

_redis: Redis | None = None
_memory_cache: dict[str, tuple[float, Any]] = {}
_memory_versions: dict[str, int] = {}
_memory_locks: dict[str, float] = {}


async def _get_redis() -> Redis | None:
    global _redis
    if not settings.use_redis or not settings.redis_url:
        return None
    if _redis is None:
        _redis = Redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


def _stable_key(prefix: str, payload: dict[str, Any]) -> str:
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode("utf-8")).hexdigest()
    return f"{prefix}:{digest}"


async def get_user_cache_version(user_id: str) -> int:
    redis = await _get_redis()
    key = f"unisync:cache:version:{user_id}"
    if redis:
        value = await redis.get(key)
        return int(value) if value else 0
    return _memory_versions.get(key, 0)


async def bump_user_cache_version(user_id: str) -> int:
    redis = await _get_redis()
    key = f"unisync:cache:version:{user_id}"
    if redis:
        value = await redis.incr(key)
        await redis.expire(key, 86400)
        return int(value)
    _memory_versions[key] = _memory_versions.get(key, 0) + 1
    return _memory_versions[key]


async def get_cached_json(prefix: str, payload: dict[str, Any]) -> Any | None:
    redis = await _get_redis()
    key = _stable_key(prefix, payload)
    if redis:
        raw = await redis.get(key)
        return json.loads(raw) if raw else None
    cached = _memory_cache.get(key)
    if not cached:
        return None
    expires_at, value = cached
    if expires_at <= time.time():
        _memory_cache.pop(key, None)
        return None
    return value


async def set_cached_json(prefix: str, payload: dict[str, Any], value: Any, ttl_seconds: int = 20) -> None:
    redis = await _get_redis()
    key = _stable_key(prefix, payload)
    if redis:
        await redis.set(key, json.dumps(value), ex=ttl_seconds)
        return
    _memory_cache[key] = (time.time() + ttl_seconds, value)


async def acquire_recent_lock(scope: str, identity: str, ttl_seconds: int = 900) -> bool:
    redis = await _get_redis()
    key = f"unisync:lock:{scope}:{identity}"
    if redis:
        return bool(await redis.set(key, "1", ex=ttl_seconds, nx=True))
    now = time.time()
    expires_at = _memory_locks.get(key, 0)
    if expires_at > now:
        return False
    _memory_locks[key] = now + ttl_seconds
    return True

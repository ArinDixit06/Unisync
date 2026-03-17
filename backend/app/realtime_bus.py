import json
import asyncio
from redis.asyncio import Redis
from app.config import settings
from app.realtime import manager

_channel = "unisync:realtime"
_redis: Redis | None = None


async def _get_redis() -> Redis:
    global _redis
    if _redis is None:
        if not settings.use_redis or not settings.redis_url:
            raise RuntimeError("Redis disabled")
        _redis = Redis.from_url(settings.redis_url)
    return _redis


async def publish_event(user_id: str, payload: dict) -> None:
    if not settings.use_redis or not settings.redis_url:
        return
    redis = await _get_redis()
    await redis.publish(_channel, json.dumps({"user_id": user_id, "payload": payload}))


async def listen_and_forward(stop_event: asyncio.Event) -> None:
    if not settings.use_redis or not settings.redis_url:
        return
    redis = await _get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(_channel)
    try:
        while not stop_event.is_set():
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message.get("data"):
                data = json.loads(message["data"])
                user_id = data.get("user_id")
                payload = data.get("payload")
                if user_id and payload:
                    await manager.send(user_id, payload)
    finally:
        await pubsub.unsubscribe(_channel)

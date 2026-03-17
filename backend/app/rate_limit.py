import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
import jwt
from app.config import settings


class RateLimiter:
    def __init__(self, limit_per_minute: int, key_prefix: str):
        self.limit = limit_per_minute
        self.key_prefix = key_prefix
        self.windows = defaultdict(lambda: {"start": 0.0, "count": 0})

    def _window_key(self, key: str) -> str:
        return f"{self.key_prefix}:{key}"

    def check(self, key: str) -> None:
        now = time.time()
        window = self.windows[self._window_key(key)]
        if now - window["start"] >= 60:
            window["start"] = now
            window["count"] = 0
        window["count"] += 1
        if window["count"] > self.limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"code": "rate_limited", "message": "Too many requests"},
            )


def rate_limit(limiter: RateLimiter, key_func):
    async def dependency(request: Request):
        key = key_func(request)
        limiter.check(key)

    return dependency


def ip_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def user_key(request: Request) -> str:
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        return ip_key(request)
    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload.get("sub") or ip_key(request)
    except jwt.PyJWTError:
        return ip_key(request)

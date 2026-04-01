import hmac
import hashlib
from fastapi import HTTPException, status
from app.config import settings


def verify_signature(body: bytes, signature: str | None):
    if not settings.webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "server_misconfigured", "message": "Webhook signature secret is not configured"},
        )
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthorized", "message": "Missing webhook signature"},
        )
    mac = hmac.new(settings.webhook_secret.encode("utf-8"), body, hashlib.sha256)
    expected = mac.hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthorized", "message": "Invalid webhook signature"},
        )

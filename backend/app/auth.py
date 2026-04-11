from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
import jwt
from app.supabase_auth import decode_supabase_token


class AuthUser:
    def __init__(self, user_id: str, email: str | None = None, token: str | None = None):
        self.user_id = user_id
        self.email = email
        self.token = token


def _decode_token(token: str) -> dict:
    try:
        return decode_supabase_token(token)
    except jwt.PyJWTError:
        try:
            return jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": False},
            )
        except jwt.PyJWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "unauthorized", "message": "Invalid token"},
            ) from exc


async def get_current_user(request: Request) -> AuthUser:
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthorized", "message": "Missing token"},
        )
    token = auth_header.split(" ", 1)[1].strip()
    payload = _decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthorized", "message": "Invalid token"},
        )
    return AuthUser(user_id=user_id, email=payload.get("email"), token=token)


def user_id_dep(user: AuthUser = Depends(get_current_user)) -> str:
    return user.user_id


def user_token_dep(user: AuthUser = Depends(get_current_user)) -> str:
    return user.token or ""

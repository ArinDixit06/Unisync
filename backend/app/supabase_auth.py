import jwt
from jwt import PyJWKClient

from app.config import settings

_jwks: PyJWKClient | None = None


def _jwks_client() -> PyJWKClient:
    global _jwks
    if _jwks is None:
        _jwks = PyJWKClient(settings.supabase_url.rstrip("/") + "/auth/v1/.well-known/jwks.json")
    return _jwks


def decode_supabase_token(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    algorithm = header.get("alg")
    options = {"verify_aud": False}

    if algorithm == "HS256":
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options=options,
        )

    signing_key = _jwks_client().get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=[algorithm] if algorithm else None,
        options=options,
    )


def get_token_subject(token: str) -> str | None:
    try:
        return decode_supabase_token(token).get("sub")
    except jwt.PyJWTError:
        return None

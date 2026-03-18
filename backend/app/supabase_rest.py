import httpx
from app.config import settings

_client: httpx.AsyncClient | None = None


def _rest_url() -> str:
    return settings.supabase_url.rstrip("/") + "/rest/v1"


def _headers(user_token: str | None = None, use_service: bool = False) -> dict:
    if use_service:
        if not settings.supabase_service_role_key:
            raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY required for service operations")
        token = settings.supabase_service_role_key
    else:
        token = user_token or settings.supabase_anon_key
    return {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=15)
    return _client


def _apply_filters(params: dict, filters: list[tuple[str, str, str]] | None) -> None:
    if not filters:
        return
    for column, operator, value in filters:
        params[column] = f"{operator}.{value}"


async def select(
    table: str,
    select: str,
    *,
    filters: list[tuple[str, str, str]] | None = None,
    order: str | None = None,
    limit: int | None = None,
    offset: int | None = None,
    user_token: str | None = None,
    use_service: bool = False,
):
    client = await _get_client()
    params: dict[str, str] = {"select": select}
    _apply_filters(params, filters)
    if order:
        params["order"] = order
    if limit is not None:
        params["limit"] = str(limit)
    if offset is not None:
        params["offset"] = str(offset)
    resp = await client.get(
        f"{_rest_url()}/{table}",
        params=params,
        headers=_headers(user_token=user_token, use_service=use_service),
    )
    resp.raise_for_status()
    return resp.json()


async def insert(
    table: str,
    payload,
    *,
    user_token: str | None = None,
    use_service: bool = False,
    returning: bool = False,
):
    client = await _get_client()
    headers = _headers(user_token=user_token, use_service=use_service)
    if returning:
        headers["Prefer"] = "return=representation"
    resp = await client.post(
        f"{_rest_url()}/{table}",
        json=payload,
        headers=headers,
    )
    resp.raise_for_status()
    if not resp.content:
        return {}
    return resp.json()


async def update(
    table: str,
    payload,
    *,
    filters: list[tuple[str, str, str]],
    user_token: str | None = None,
    use_service: bool = False,
    returning: bool = False,
):
    client = await _get_client()
    params: dict[str, str] = {}
    _apply_filters(params, filters)
    headers = _headers(user_token=user_token, use_service=use_service)
    if returning:
        headers["Prefer"] = "return=representation"
    resp = await client.patch(
        f"{_rest_url()}/{table}",
        params=params,
        json=payload,
        headers=headers,
    )
    resp.raise_for_status()
    return resp.json() if resp.content else None


async def delete(
    table: str,
    *,
    filters: list[tuple[str, str, str]],
    user_token: str | None = None,
    use_service: bool = False,
):
    client = await _get_client()
    params: dict[str, str] = {}
    _apply_filters(params, filters)
    resp = await client.delete(
        f"{_rest_url()}/{table}",
        params=params,
        headers=_headers(user_token=user_token, use_service=use_service),
    )
    resp.raise_for_status()
    return True

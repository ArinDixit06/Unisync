import asyncio
import time
from fastapi import FastAPI, Request, HTTPException
import httpx
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.logging import configure_logging, get_logger
from app.db import init_db, close_db
from app.realtime_bus import listen_and_forward
from app.config import settings, frontend_origins
from app.supabase_auth import get_token_subject
from app.routers import health, auth, emails, compose, search, labels, calendar, webhooks, sync, realtime

logger = get_logger()

app = FastAPI(title="UniSync API", version="0.1.0")

cors_origins = frontend_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(emails.router)
app.include_router(compose.router)
app.include_router(search.router)
app.include_router(labels.router)
app.include_router(calendar.router)
app.include_router(webhooks.router)
app.include_router(sync.router)
app.include_router(realtime.router)

_stop_event = asyncio.Event()


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": "http_error", "message": str(exc.detail)}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "validation_error", "message": "Invalid request", "details": exc.errors()}},
    )


@app.exception_handler(httpx.HTTPStatusError)
async def httpx_status_exception_handler(_request: Request, exc: httpx.HTTPStatusError):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "supabase_error",
                "message": exc.response.text,
                "status": exc.response.status_code,
            }
        },
    )


@app.on_event("startup")
async def startup():
    configure_logging()
    if settings.use_db:
        await init_db()
    if settings.use_redis and settings.redis_url:
        asyncio.create_task(listen_and_forward(_stop_event))


@app.on_event("shutdown")
async def shutdown():
    _stop_event.set()
    await close_db()


def _extract_user_id(request: Request) -> str | None:
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    return get_token_subject(token)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    latency_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        latency_ms=round(latency_ms, 2),
        user_id=_extract_user_id(request),
    )
    return response

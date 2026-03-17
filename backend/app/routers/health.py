from fastapi import APIRouter
from app.db import fetch_one
from app.config import settings
import time

router = APIRouter()
_start = time.time()


@router.get("/health")
async def health():
  return {"status": "ok", "version": "0.1.0", "uptime": int(time.time() - _start)}


@router.get("/ready")
async def ready():
  if not settings.use_db:
    return {"status": "ok", "db": False}
  row = await fetch_one("SELECT 1")
  return {"status": "ok", "db": bool(row)}

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import jwt
from app.supabase_auth import decode_supabase_token
from app.realtime import manager

router = APIRouter()


def _decode_token(token: str) -> dict | None:
    try:
        return decode_supabase_token(token)
    except jwt.PyJWTError:
        return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.headers.get("sec-websocket-protocol")
    payload = _decode_token(token) if token else None
    if not payload:
        await websocket.close(code=4401)
        return
    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4401)
        return

    await websocket.accept(subprotocol=token)
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

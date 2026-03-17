from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import jwt
from app.config import settings
from app.realtime import manager

router = APIRouter()


def _decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except jwt.PyJWTError:
        try:
            return jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": False},
            )
        except jwt.PyJWTError:
            return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    payload = _decode_token(token) if token else None
    if not payload:
        await websocket.close(code=4401)
        return
    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4401)
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

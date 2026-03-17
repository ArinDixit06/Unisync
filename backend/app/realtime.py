from fastapi import WebSocket
from collections import defaultdict


class ConnectionManager:
    def __init__(self) -> None:
        self.active = defaultdict(list)

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        if user_id in self.active:
            self.active[user_id] = [ws for ws in self.active[user_id] if ws != websocket]

    async def send(self, user_id: str, message: dict) -> None:
        for ws in list(self.active.get(user_id, [])):
            await ws.send_json(message)


manager = ConnectionManager()

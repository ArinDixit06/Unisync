import type WebSocket from "ws";

class ConnectionManager {
  active = new Map<string, Set<WebSocket>>();

  connect(userId: string, socket: WebSocket): void {
    const sockets = this.active.get(userId) ?? new Set<WebSocket>();
    sockets.add(socket);
    this.active.set(userId, sockets);
  }

  disconnect(userId: string, socket: WebSocket): void {
    const sockets = this.active.get(userId);
    if (!sockets) return;
    sockets.delete(socket);
    if (!sockets.size) this.active.delete(userId);
  }

  send(userId: string, payload: Record<string, unknown>): void {
    for (const socket of this.active.get(userId) ?? []) {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(payload));
      }
    }
  }
}

export const manager = new ConnectionManager();

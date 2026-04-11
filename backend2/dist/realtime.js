class ConnectionManager {
    active = new Map();
    connect(userId, socket) {
        const sockets = this.active.get(userId) ?? new Set();
        sockets.add(socket);
        this.active.set(userId, sockets);
    }
    disconnect(userId, socket) {
        const sockets = this.active.get(userId);
        if (!sockets)
            return;
        sockets.delete(socket);
        if (!sockets.size)
            this.active.delete(userId);
    }
    send(userId, payload) {
        for (const socket of this.active.get(userId) ?? []) {
            if (socket.readyState === socket.OPEN) {
                socket.send(JSON.stringify(payload));
            }
        }
    }
}
export const manager = new ConnectionManager();

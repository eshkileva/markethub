type SocketLike = {
  readyState: number;
  send: (data: string) => void;
};

export type ChatPush = {
  type: 'message';
  conversationId: string;
  message: {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
  };
};

const OPEN = 1;

export class ChatHub {
  private readonly sockets = new Map<string, Set<SocketLike>>();

  add(userId: string, socket: SocketLike) {
    const set = this.sockets.get(userId) ?? new Set();
    set.add(socket);
    this.sockets.set(userId, set);
  }

  remove(userId: string, socket: SocketLike) {
    const set = this.sockets.get(userId);
    if (!set) return;
    set.delete(socket);
    if (set.size === 0) this.sockets.delete(userId);
  }

  send(userId: string, payload: ChatPush | { type: 'hello'; userId: string }) {
    const set = this.sockets.get(userId);
    if (!set) return;
    const data = JSON.stringify(payload);
    for (const socket of set) {
      if (socket.readyState === OPEN) {
        socket.send(data);
      }
    }
  }

  sendTo(userIds: string[], payload: ChatPush) {
    const unique = new Set(userIds);
    for (const userId of unique) {
      this.send(userId, payload);
    }
  }
}

import { ChatHub } from '../infrastructure/chat-hub.js';

describe('ChatHub', () => {
  it('delivers only to open sockets of listed users', () => {
    const hub = new ChatHub();
    const received: string[] = [];
    const socket = {
      readyState: 1,
      send: (data: string) => {
        received.push(data);
      },
    };

    hub.add('user-a', socket);
    hub.sendTo(['user-a', 'user-b'], {
      type: 'message',
      conversationId: 'c1',
      message: { id: 'm1', senderId: 'user-a', body: 'hi', createdAt: new Date().toISOString() },
    });

    expect(received).toHaveLength(1);
    expect(JSON.parse(received[0]!).type).toBe('message');
  });
});

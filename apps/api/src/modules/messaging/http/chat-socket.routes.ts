import type { FastifyPluginAsync } from 'fastify';
import { verifyAccessToken } from '../../auth/domain/crypto.js';

export const chatSocketRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/ws/chat', { websocket: true }, async (socket, request) => {
    const token =
      typeof request.query === 'object' && request.query && 'access_token' in request.query
        ? String((request.query as { access_token?: string }).access_token ?? '')
        : '';

    let userId: string;
    try {
      const payload = await verifyAccessToken(app.config, token);
      userId = payload.sub;
    } catch {
      socket.close(4401, 'Unauthorized');
      return;
    }

    app.chatHub.add(userId, socket);
    app.chatHub.send(userId, { type: 'hello', userId });

    socket.on('message', (raw: Buffer | ArrayBuffer | Buffer[]) => {
      const text = raw.toString();
      if (text === 'ping' || text.includes('"type":"ping"')) {
        socket.send(JSON.stringify({ type: 'pong' }));
      }
    });

    socket.on('close', () => {
      app.chatHub.remove(userId, socket);
    });
  });
};

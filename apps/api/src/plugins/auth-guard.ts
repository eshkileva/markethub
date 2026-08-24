import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/app-error.js';
import { verifyAccessToken } from '../modules/auth/domain/crypto.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; role: string };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    tryAuthenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireModerator: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('tryAuthenticate', async (request) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return;
    try {
      const payload = await verifyAccessToken(app.config, header.slice('Bearer '.length));
      request.user = { id: payload.sub, role: payload.role };
    } catch {
      // public routes stay anonymous on a bad/expired token
    }
  });

  app.decorate('authenticate', async (request) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError();
    }
    const token = header.slice('Bearer '.length);
    try {
      const payload = await verifyAccessToken(app.config, token);
      request.user = { id: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedError('Invalid access token');
    }
  });

  app.decorate('requireModerator', async (request) => {
    const role = request.user?.role;
    if (role !== 'moderator' && role !== 'admin') {
      throw new ForbiddenError('Moderator access required');
    }
  });
};

export const authGuardPlugin = fp(authPlugin);

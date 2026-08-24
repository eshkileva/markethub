import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import { sql } from 'drizzle-orm';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { MAX_UPLOAD_BYTES } from '@markethub/shared';
import type { AppConfig } from './config/env.js';
import type { Database } from './infrastructure/database/client.js';
import type { RedisClient } from './infrastructure/redis/client.js';
import type { ObjectStorage } from './infrastructure/storage/s3.js';
import type { HybridEventBus } from './infrastructure/messaging/rabbitmq-event-bus.js';
import { AppError } from './shared/errors/app-error.js';
import { registerContainer } from './plugins/container.js';
import { authGuardPlugin } from './plugins/auth-guard.js';
import { authRoutes } from './modules/auth/http/auth.routes.js';
import { categoriesRoutes } from './modules/categories/http/categories.routes.js';
import { listingsRoutes } from './modules/listings/http/listings.routes.js';
import { favoritesRoutes } from './modules/favorites/http/favorites.routes.js';
import { mediaRoutes } from './modules/media/http/media.routes.js';
import { messagingRoutes } from './modules/messaging/http/messaging.routes.js';
import { purchasesRoutes } from './modules/purchases/http/purchases.routes.js';
import { chatSocketRoutes } from './modules/messaging/http/chat-socket.routes.js';
import { reviewsRoutes } from './modules/reviews/http/reviews.routes.js';
import { reportsRoutes } from './modules/reports/http/reports.routes.js';
import { notificationsRoutes } from './modules/notifications/http/notifications.routes.js';
import { usersRoutes } from './modules/users/http/users.routes.js';

function isLocalDevOrigin(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export async function buildApp(deps: {
  config: AppConfig;
  db: Database;
  redis: RedisClient;
  storage: ObjectStorage;
  events: HybridEventBus;
}) {
  const app = Fastify({
    logger: {
      level: deps.config.LOG_LEVEL,
      transport: deps.config.isDev
        ? {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss' },
          }
        : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (deps.config.webOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (deps.config.isDev && isLocalDevOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cookie, { secret: deps.config.COOKIE_SECRET });
  await app.register(multipart, {
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
      files: 1,
    },
  });
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
  await app.register(websocket);

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'MarketHub API',
        description: 'C2C marketplace for CIS countries',
        version: '0.1.0',
      },
      servers: [{ url: deps.config.PUBLIC_API_URL }],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  await app.register(registerContainer, deps);
  await app.register(authGuardPlugin);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    const fastifyError = error as { statusCode?: number; code?: string; message: string };
    const statusCode = typeof fastifyError.statusCode === 'number' ? fastifyError.statusCode : 500;
    if (statusCode >= 400 && statusCode < 500) {
      return reply.status(statusCode).send({
        error: {
          code: fastifyError.code ?? 'REQUEST_ERROR',
          message: fastifyError.message,
        },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  });

  app.get('/health', async () => ({ status: 'ok', service: 'markethub-api' }));

  app.get('/ready', async (_request, reply) => {
    try {
      await deps.db.execute(sql`select 1`);
      const pong = await deps.redis.ping();
      if (pong !== 'PONG') {
        return reply.status(503).send({ status: 'not_ready' });
      }
      return { status: 'ready' };
    } catch (error) {
      app.log.error(error);
      return reply.status(503).send({ status: 'not_ready' });
    }
  });

  await app.register(authRoutes, { prefix: '/v1/auth' });
  await app.register(usersRoutes, { prefix: '/v1/users' });
  await app.register(categoriesRoutes, { prefix: '/v1/categories' });
  await app.register(listingsRoutes, { prefix: '/v1/listings' });
  await app.register(favoritesRoutes, { prefix: '/v1/favorites' });
  await app.register(messagingRoutes, { prefix: '/v1/conversations' });
  await app.register(purchasesRoutes, { prefix: '/v1/purchases' });
  await app.register(reviewsRoutes, { prefix: '/v1/reviews' });
  await app.register(reportsRoutes, { prefix: '/v1/reports' });
  await app.register(notificationsRoutes, { prefix: '/v1/notifications' });
  await app.register(mediaRoutes, { prefix: '/v1/media' });
  await app.register(chatSocketRoutes);

  app.get('/v1/ws/health', { websocket: true }, (socket) => {
    socket.send(JSON.stringify({ type: 'hello', service: 'markethub' }));
    socket.on('message', (message: Buffer | ArrayBuffer | Buffer[]) => {
      socket.send(JSON.stringify({ type: 'echo', payload: message.toString() }));
    });
  });

  return app;
}

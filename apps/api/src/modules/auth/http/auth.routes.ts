import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  verifyEmailSchema,
} from '@markethub/shared';
import { z } from 'zod';

const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  country: z.string(),
  city: z.string().nullable(),
  trustScore: z.number(),
  isVerified: z.boolean(),
  role: z.string(),
  emailVerified: z.boolean(),
});

const authResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int(),
  user: authUserSchema,
  devVerificationCode: z.string().optional(),
});

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/register',
    {
      schema: {
        tags: ['auth'],
        body: registerSchema,
        response: { 201: authResponseSchema },
      },
      config: {
        rateLimit: { max: 10, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      const result = await app.services.auth.register(request.body, {
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      });
      reply.setCookie(app.config.REFRESH_COOKIE_NAME, result.refreshToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: !app.config.isDev,
        expires: result.expiresAt,
      });
      return reply.status(201).send({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
        devVerificationCode: result.devVerificationCode,
      });
    },
  );

  app.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        body: loginSchema,
        response: { 200: authResponseSchema },
      },
      config: {
        rateLimit: { max: 10, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      const result = await app.services.auth.login(request.body, {
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      });
      reply.setCookie(app.config.REFRESH_COOKIE_NAME, result.refreshToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: !app.config.isDev,
        expires: result.expiresAt,
      });
      return {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
      };
    },
  );

  app.post(
    '/refresh',
    {
      schema: {
        tags: ['auth'],
        response: { 200: authResponseSchema },
      },
    },
    async (request, reply) => {
      const refreshToken = request.cookies[app.config.REFRESH_COOKIE_NAME];
      const result = await app.services.auth.refresh(refreshToken ?? '', {
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      });
      reply.setCookie(app.config.REFRESH_COOKIE_NAME, result.refreshToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: !app.config.isDev,
        expires: result.expiresAt,
      });
      return {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
      };
    },
  );

  app.post(
    '/logout',
    {
      schema: { tags: ['auth'] },
    },
    async (request, reply) => {
      const refreshToken = request.cookies[app.config.REFRESH_COOKIE_NAME];
      await app.services.auth.logout(refreshToken);
      reply.clearCookie(app.config.REFRESH_COOKIE_NAME, { path: '/' });
      return { ok: true };
    },
  );

  app.get(
    '/me',
    {
      schema: { tags: ['auth'] },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.auth.me(request.user!.id),
  );

  app.post(
    '/logout-all',
    {
      schema: { tags: ['auth'] },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      await app.services.auth.logoutAll(request.user!.id);
      reply.clearCookie(app.config.REFRESH_COOKIE_NAME, { path: '/' });
      return { ok: true };
    },
  );

  app.patch(
    '/profile',
    {
      schema: {
        tags: ['auth'],
        body: updateProfileSchema,
      },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.auth.updateProfile(request.user!.id, request.body),
  );

  app.post(
    '/change-password',
    {
      schema: {
        tags: ['auth'],
        body: changePasswordSchema,
      },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.auth.changePassword(request.user!.id, request.body),
  );

  app.get(
    '/sessions',
    {
      schema: { tags: ['auth'] },
      preHandler: [app.authenticate],
    },
    async (request) =>
      app.services.auth.listSessions(
        request.user!.id,
        request.cookies[app.config.REFRESH_COOKIE_NAME],
      ),
  );

  app.post(
    '/verify-email',
    {
      schema: {
        tags: ['auth'],
        body: verifyEmailSchema,
        response: { 200: authUserSchema },
      },
      preHandler: [app.authenticate],
      config: {
        rateLimit: { max: 10, timeWindow: '1 minute' },
      },
    },
    async (request) => app.services.auth.verifyEmail(request.user!.id, request.body),
  );

  app.post(
    '/resend-verification',
    {
      schema: {
        tags: ['auth'],
        response: {
          200: z.object({
            ok: z.literal(true),
            devVerificationCode: z.string().optional(),
          }),
        },
      },
      preHandler: [app.authenticate],
      config: {
        rateLimit: { max: 3, timeWindow: '1 minute' },
      },
    },
    async (request) => app.services.auth.resendVerification(request.user!.id),
  );
};

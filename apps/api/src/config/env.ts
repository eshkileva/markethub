import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().default(3000),
  PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  COOKIE_SECRET: z.string().min(16),
  REFRESH_COOKIE_NAME: z.string().default('mh_refresh'),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  S3_PUBLIC_URL: z.string().url(),
  RABBITMQ_URL: z.string().default('amqp://markethub:markethub@localhost:5672'),
  RABBITMQ_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

export type AppConfig = z.infer<typeof envSchema> & {
  isDev: boolean;
  webOrigins: string[];
};

export function parseWebOrigins(webOrigin: string): string[] {
  const configured = webOrigin
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const origins = new Set(configured);
  for (const origin of configured) {
    try {
      const url = new URL(origin);
      if (url.hostname.startsWith('www.')) {
        url.hostname = url.hostname.slice(4);
      } else {
        url.hostname = `www.${url.hostname}`;
      }
      origins.add(url.origin);
    } catch {
      // ignore invalid origin entries
    }
  }
  return [...origins];
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.parse(env);
  return {
    ...parsed,
    isDev: parsed.NODE_ENV !== 'production',
    webOrigins: parseWebOrigins(parsed.WEB_ORIGIN),
  };
}

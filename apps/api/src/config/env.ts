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
  GEOHELPER_API_KEY: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  CURRENCYAPI_KEY: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  MOBILEAPI_KEY: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  APIFY_TOKEN: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  FX_CACHE_TTL_SECONDS: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z.coerce.number().int().min(60).default(3600),
  ),
  SMTP_HOST: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  SMTP_PORT: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z.coerce.number().int().min(1).max(65535).default(587),
  ),
  SMTP_USER: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  SMTP_PASS: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  EMAIL_FROM: z.string().email().default('noreply@kupilko.store'),
  OPENROUTER_API_KEY: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  OPENROUTER_MODEL: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  OPENROUTER_VISION_MODEL: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  AI_COPILOT_DAILY_LIMIT: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z.coerce.number().int().min(0).default(20),
  ),
});

export type AppConfig = z.infer<typeof envSchema> & {
  isDev: boolean;
  webOrigins: string[];
  aiEnabled: boolean;
  aiVisionEnabled: boolean;
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
  const hasKey = Boolean(parsed.OPENROUTER_API_KEY);
  const hasTextModel = Boolean(parsed.OPENROUTER_MODEL);
  const hasVisionModel = Boolean(parsed.OPENROUTER_VISION_MODEL);
  return {
    ...parsed,
    isDev: parsed.NODE_ENV !== 'production',
    webOrigins: parseWebOrigins(parsed.WEB_ORIGIN),
    aiEnabled: hasKey && (hasTextModel || hasVisionModel),
    aiVisionEnabled: hasKey && hasVisionModel,
  };
}

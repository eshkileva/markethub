import type { FastifyBaseLogger } from 'fastify';

export type AiCallMeta = {
  operation: string;
  model: string;
  userId?: string;
  listingId?: string;
};

export class AiCallLogger {
  constructor(private readonly log: FastifyBaseLogger) {}

  success(meta: AiCallMeta, startedAt: number) {
    this.log.info(
      {
        ai: true,
        ...meta,
        durationMs: Date.now() - startedAt,
        ok: true,
      },
      'AI call completed',
    );
  }

  failure(meta: AiCallMeta, startedAt: number, error: unknown) {
    this.log.warn(
      {
        ai: true,
        ...meta,
        durationMs: Date.now() - startedAt,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      'AI call failed',
    );
  }
}

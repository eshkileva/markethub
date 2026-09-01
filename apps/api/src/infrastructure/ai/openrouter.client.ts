import type { AppConfig } from '../../config/env.js';
import { ValidationError } from '../../shared/errors/app-error.js';
import { parseModelJson } from './parse-model-json.js';
import type { AiCallLogger, AiCallMeta } from './ai-call-logger.js';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content:
    | string
    | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
};

export type ChatJsonOptions = {
  model?: string;
  meta?: Omit<AiCallMeta, 'model'>;
  logger?: AiCallLogger;
};

function messageContent(content: ChatMessage['content']): string {
  if (typeof content === 'string') return content;
  return content
    .map((part) => (part.type === 'text' ? part.text : '[image]'))
    .join('\n');
}

function messageHasImage(messages: ChatMessage[]) {
  return messages.some(
    (item) =>
      Array.isArray(item.content) && item.content.some((part) => part.type === 'image_url'),
  );
}

export class OpenRouterClient {
  constructor(private readonly config: AppConfig) {}

  get model() {
    return this.config.OPENROUTER_MODEL ?? this.config.OPENROUTER_VISION_MODEL ?? 'unknown';
  }

  get visionModel() {
    return this.config.OPENROUTER_VISION_MODEL ?? this.config.OPENROUTER_MODEL ?? 'unknown';
  }

  resolveModel(messages: ChatMessage[], override?: string) {
    if (override) return override;
    if (messageHasImage(messages)) return this.visionModel;
    return this.model;
  }

  assertEnabled() {
    if (!this.config.aiEnabled) {
      throw new ValidationError('AI copilot is not configured');
    }
  }

  async chatJson<T>(messages: ChatMessage[], options?: ChatJsonOptions): Promise<T> {
    this.assertEnabled();

    const model = this.resolveModel(messages, options?.model);
    const startedAt = Date.now();
    const callMeta: AiCallMeta = {
      operation: options?.meta?.operation ?? 'chat-json',
      model,
      userId: options?.meta?.userId,
      listingId: options?.meta?.listingId,
    };

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.2,
    };

    if (!model.includes(':free')) {
      body.response_format = { type: 'json_object' };
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.config.PUBLIC_API_URL,
          'X-Title': 'Kupilko',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new ValidationError(`AI provider error: ${response.status} ${text}`.slice(0, 240));
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null; reasoning?: string | null } }>;
      };
      const message = payload.choices?.[0]?.message;
      const content = message?.content;
      if (!content || typeof content !== 'string') {
        const reasoning =
          typeof message?.reasoning === 'string' ? parseModelJson<T>(message.reasoning) : null;
        if (reasoning) {
          options?.logger?.success(callMeta, startedAt);
          return reasoning;
        }
        throw new ValidationError('AI provider returned an empty response');
      }

      try {
        const parsed = parseModelJson<T>(content, this.config.isDev);
        options?.logger?.success(callMeta, startedAt);
        return parsed;
      } catch (error) {
        if (typeof message?.reasoning === 'string') {
          try {
            const parsed = parseModelJson<T>(message.reasoning, this.config.isDev);
            options?.logger?.success(callMeta, startedAt);
            return parsed;
          } catch {
            // fall through
          }
        }
        throw error;
      }
    } catch (error) {
      options?.logger?.failure(callMeta, startedAt, error);
      throw error;
    }
  }

  debugPrompt(messages: ChatMessage[]) {
    return messages.map((item) => `${item.role}: ${messageContent(item.content)}`).join('\n\n');
  }
}

import { ValidationError } from '../../shared/errors/app-error.js';

function tryParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(start, index + 1);
      }
    }
  }

  return null;
}

export function parseModelJson<T = unknown>(raw: string, debug = false): T {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new ValidationError('AI provider returned an empty response');
  }

  const direct = tryParseJson<T>(trimmed);
  if (direct) return direct;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fenced) {
    const parsed = tryParseJson<T>(fenced);
    if (parsed) return parsed;
  }

  const objectText = extractJsonObject(trimmed);
  if (objectText) {
    const parsed = tryParseJson<T>(objectText);
    if (parsed) return parsed;
  }

  const preview = trimmed.slice(0, 240).replace(/\s+/g, ' ');
  throw new ValidationError(
    debug ? `AI provider returned invalid JSON: ${preview}` : 'AI provider returned invalid JSON',
  );
}

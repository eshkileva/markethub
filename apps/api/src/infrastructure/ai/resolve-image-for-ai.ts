import { MAX_UPLOAD_BYTES } from '@markethub/shared';
import type { AppConfig } from '../../config/env.js';
import type { ObjectStorage } from '../storage/s3.js';
import { ValidationError } from '../../shared/errors/app-error.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function isPrivateHost(hostname: string) {
  if (LOCAL_HOSTS.has(hostname) || hostname.endsWith('.local')) {
    return true;
  }
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
  return false;
}

export function objectKeyFromPublicUrl(config: AppConfig, imageUrl: string) {
  const prefix = `${config.S3_PUBLIC_URL.replace(/\/$/, '')}/`;
  if (!imageUrl.startsWith(prefix)) {
    return null;
  }
  const key = imageUrl.slice(prefix.length);
  return key.length > 0 ? key : null;
}

function toDataUrl(contentType: string, body: Buffer) {
  if (body.byteLength > MAX_UPLOAD_BYTES) {
    throw new ValidationError('Image is too large for AI analysis');
  }
  return `data:${contentType};base64,${body.toString('base64')}`;
}

export async function resolveImageForAi(
  config: AppConfig,
  storage: ObjectStorage,
  imageUrl: string,
): Promise<string> {
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new ValidationError('Invalid image URL');
  }

  const ownKey = objectKeyFromPublicUrl(config, imageUrl);
  if (ownKey) {
    const object = await storage.getObject(ownKey);
    return toDataUrl(object.contentType, object.body);
  }

  if (isPrivateHost(parsed.hostname)) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new ValidationError('Could not load image for AI analysis');
    }
    const body = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    return toDataUrl(contentType, body);
  }

  return imageUrl;
}

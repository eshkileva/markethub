import { createHash, randomBytes, randomInt } from 'node:crypto';
import * as argon2 from 'argon2';
import { SignJWT, jwtVerify } from 'jose';
import type { AppConfig } from '../../../config/env.js';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
export const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;
export const VERIFICATION_MAX_ATTEMPTS = 5;

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export async function signAccessToken(
  config: AppConfig,
  payload: { sub: string; role: string },
): Promise<string> {
  const secret = new TextEncoder().encode(config.JWT_SECRET);
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAccessToken(
  config: AppConfig,
  token: string,
): Promise<{ sub: string; role: string }> {
  const secret = new TextEncoder().encode(config.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret, { clockTolerance: 30 });
  if (!payload.sub || typeof payload.role !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub: payload.sub, role: payload.role };
}

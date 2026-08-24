export const ACCESS_TOKEN_REFRESH_SKEW_MS = 60_000;

function browserApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL ?? '';
  if (!import.meta.env.DEV || typeof window === 'undefined' || !configured) {
    return configured;
  }
  try {
    const apiHost = new URL(configured).hostname;
    const pageHost = window.location.hostname;
    if (
      (pageHost === 'localhost' || pageHost === '127.0.0.1') &&
      (apiHost === 'localhost' || apiHost === '127.0.0.1') &&
      apiHost !== pageHost
    ) {
      return '';
    }
  } catch {
    return '';
  }
  return configured;
}

export const API_URL = browserApiUrl();

export function resolveApiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export function chatSocketUrl(token: string): string {
  const httpBase =
    API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
  const wsBase = httpBase.replace(/^http/i, 'ws');
  return `${wsBase}/v1/ws/chat?access_token=${encodeURIComponent(token)}`;
}

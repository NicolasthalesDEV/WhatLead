/**
 * Client-side fetch wrapper that automatically injects the CSRF token header
 * for all mutating requests (POST, PUT, PATCH, DELETE).
 *
 * Usage (drop-in replacement for fetch):
 *   import { fetchApi } from '@/lib/api';
 *   const res = await fetchApi('/api/tickets', { method: 'POST', body: JSON.stringify(data) });
 */

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Reads the csrf-token from document.cookie (cookie is non-httpOnly intentionally).
 * Returns an empty string in SSR context.
 */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Fetch wrapper that auto-injects x-csrf-token for mutations.
 * Falls back to plain fetch if no token is available (SSR or GET requests).
 */
export async function fetchApi(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase();

  if (SAFE_METHODS.has(method)) {
    return fetch(input, init);
  }

  const headers = new Headers(init?.headers);

  if (!headers.has(CSRF_HEADER)) {
    const token = getCsrfToken();
    if (token) {
      headers.set(CSRF_HEADER, token);
    }
  }

  return fetch(input, { ...init, headers });
}

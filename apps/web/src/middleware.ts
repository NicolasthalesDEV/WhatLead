import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

/**
 * Timing-safe string comparison that works in Edge runtime (no Node.js crypto).
 * Returns true only when both strings are identical, without leaking timing info.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Routes that are server-to-server and must be exempt from CSRF checks. */
const CSRF_EXEMPT = [
  '/api/webhooks/',         // Meta WhatsApp inbound webhook, billing webhooks, etc.
  '/api/whatsapp/webhook',  // Alias for /api/webhooks/whatsapp — must also accept Meta POSTs
  '/api/auth/csrf',         // Token-issuance endpoint (GET, but exempt for clarity)
  '/api/auth/refresh',      // Token refresh — must work when session is stale (chicken-and-egg)
  '/api/auth/logout',       // Logout — must work even if CSRF cookie expired
  '/api/health',            // Health / liveness probes (always GET)
];

/**
 * Enforce CSRF for all browser-originated mutations (POST/PUT/PATCH/DELETE to /api/*).
 * Returns a 403 response when the token is invalid/missing, or null to continue.
 */
function enforceCsrf(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Only apply to API mutations
  if (!pathname.startsWith('/api/')) return null;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return null;

  // Exempt server-to-server endpoints
  if (CSRF_EXEMPT.some((prefix) => pathname.startsWith(prefix))) return null;

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || !timingSafeEqual(cookieToken, headerToken)) {
    return NextResponse.json(
      { error: { code: 'CSRF_TOKEN_INVALID', message: 'Invalid or missing CSRF token' } },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Next.js Middleware for security headers and protection
 * Runs on all requests before reaching the app
 */
export function middleware(request: NextRequest) {
  // CSRF enforcement — must run before any mutation reaches the handler
  const csrfError = enforceCsrf(request);
  if (csrfError) return csrfError;

  const response = NextResponse.next();

  // Auto-issue CSRF cookie on page navigation (GET, non-API) so the browser always
  // has a token ready before making any mutation. Uses Web Crypto (Edge-compatible).
  const hasCsrf = request.cookies.has(CSRF_COOKIE);
  const isPageRequest =
    !request.nextUrl.pathname.startsWith('/api/') &&
    ['GET', 'HEAD'].includes(request.method);

  if (!hasCsrf && isPageRequest) {
    // crypto.randomUUID() is available in Edge runtime
    const token =
      crypto.randomUUID().replace(/-/g, '') +
      crypto.randomUUID().replace(/-/g, '');
    response.cookies.set(CSRF_COOKIE, token, {
      httpOnly: false, // Lível pelo JS para o double-submit pattern
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
  }

  // Security Headers
  const securityHeaders = {
    // HSTS - Force HTTPS (31536000 = 1 year)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // X-Frame-Options - Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // X-Content-Type-Options - Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // X-XSS-Protection - Enable XSS filter
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer-Policy - Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions-Policy - Control browser features
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // Content-Security-Policy - Control resource loading
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.whatsapp.com https://graph.facebook.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  };

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Remove powered-by header to hide tech stack
  response.headers.delete('X-Powered-By');

  return response;
}

/**
 * Matcher configuration
 * Apply middleware to all routes except static files and public assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

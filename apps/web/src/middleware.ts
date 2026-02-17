import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for security headers and protection
 * Runs on all requests before reaching the app
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

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

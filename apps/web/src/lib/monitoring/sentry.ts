/**
 * Error Tracking with Sentry
 */
import * as Sentry from '@sentry/nextjs';

let sentryInitialized = false;

/**
 * Initialize Sentry (call once on app startup)
 */
export function initSentry() {
  if (sentryInitialized) return;

  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log('[Sentry] DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Strip sensitive headers before sending to Sentry
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      if (event.contexts?.user) {
        delete event.contexts.user.email;
        delete event.contexts.user.username;
      }
      return event;
    },
    ignoreErrors: [
      'AbortError',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
    ],
  });

  sentryInitialized = true;
  console.log('[Sentry] Initialized successfully');
}

/**
 * Captura erro para o Sentry (só envia se inicializado)
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!sentryInitialized) {
    console.error('[Error]', error, context);
    return;
  }
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}

/**
 * Define o usuário autenticado no contexto do Sentry
 */
export function setSentryUser(id: string, companyId: string) {
  if (!sentryInitialized) return;
  Sentry.setUser({ id, companyId });
}

/**
 * Limpa o contexto de usuário (logout)
 */
export function clearSentryUser() {
  if (!sentryInitialized) return;
  Sentry.setUser(null);
}


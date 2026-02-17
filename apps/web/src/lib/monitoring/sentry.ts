/**
 * Error Tracking with Sentry
 * 
 * Optional integration for production error monitoring.
 * 
 * Setup:
 * 1. Install: pnpm add @sentry/nextjs
 * 2. Configure: SENTRY_DSN in .env
 * 3. Uncomment the initialization code below
 * 4. Run: npx @sentry/wizard -i nextjs
 */

// Uncomment when you want to enable Sentry
// import * as Sentry from '@sentry/nextjs';

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
  
  // Uncomment when Sentry is installed
  /*
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Set sample rate for production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Don't send errors in development
    enabled: process.env.NODE_ENV === 'production',
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      
      // Remove sensitive data from context
      if (event.contexts?.user) {
        delete event.contexts.user.email;
        delete event.contexts.user.username;
      }
      
      return event;
    },
    
    // Ignore common errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  });
  
  sentryInitialized = true;
  console.log('[Sentry] Initialized successfully');
  */
  
  console.log('[Sentry] Not installed, install @sentry/nextjs to enable');
}

/**
 * Capture an error
 */
export function captureError(error: Error, context?: Record<string, any>) {
  // Uncomment when Sentry is installed
  /*
  if (sentryInitialized) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
  */
  
  // Fallback to console
  console.error('[Error]', error, context);
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  // Uncomment when Sentry is installed
  /*
  if (sentryInitialized) {
    Sentry.captureMessage(message, level);
  }
  */
  
  console.log(`[${level.toUpperCase()}]`, message);
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  // Uncomment when Sentry is installed
  /*
  if (sentryInitialized) {
    Sentry.setUser({
      id: user.id,
      // Don't send email/username in production for privacy
      // email: user.email,
      // username: user.username,
    });
  }
  */
}

/**
 * Add breadcrumb (for debugging context)
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
  // Uncomment when Sentry is installed
  /*
  if (sentryInitialized) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }
  */
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  // Uncomment when Sentry is installed
  /*
  if (sentryInitialized) {
    return Sentry.startTransaction({ name, op });
  }
  */
  
  return null;
}

export default {
  initSentry,
  captureError,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
};

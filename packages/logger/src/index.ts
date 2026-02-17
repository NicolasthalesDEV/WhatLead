import pino from 'pino';

/**
 * Structured logger using Pino
 * 
 * Usage:
 * ```ts
 * import { logger } from '@whatlead/logger';
 * 
 * logger.info('User logged in', { userId: 123 });
 * logger.error('Payment failed', { orderId: 456, error: err });
 * ```
 */

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Base logger configuration
const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  
  // Use pretty printing in development
  transport: !isProduction ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
  
  // Base fields for all logs
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'whatlead-crm',
  },
  
  // Serialize errors properly
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  
  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with additional context
 * 
 * @example
 * const userLogger = createLogger({ module: 'auth', userId: 123 });
 * userLogger.info('Action performed');
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log HTTP request
 */
export function logRequest(req: {
  method: string;
  url: string;
  headers?: Record<string, any>;
  userId?: string;
}) {
  logger.info({
    type: 'http_request',
    method: req.method,
    url: req.url,
    userId: req.userId,
    userAgent: req.headers?.['user-agent'],
  }, 'HTTP Request');
}

/**
 * Log HTTP response
 */
export function logResponse(res: {
  statusCode: number;
  duration: number;
  url: string;
}) {
  const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
  logger[level]({
    type: 'http_response',
    statusCode: res.statusCode,
    duration: res.duration,
    url: res.url,
  }, 'HTTP Response');
}

/**
 * Log database query
 */
export function logQuery(query: {
  operation: string;
  model: string;
  duration: number;
}) {
  logger.debug({
    type: 'db_query',
    operation: query.operation,
    model: query.model,
    duration: query.duration,
  }, 'Database Query');
}

/**
 * Log external API call
 */
export function logExternalCall(call: {
  service: string;
  endpoint: string;
  method: string;
  duration: number;
  statusCode?: number;
  error?: any;
}) {
  const level = call.error ? 'error' : 'info';
  logger[level]({
    type: 'external_api',
    service: call.service,
    endpoint: call.endpoint,
    method: call.method,
    duration: call.duration,
    statusCode: call.statusCode,
    error: call.error,
  }, `External API: ${call.service}`);
}

/**
 * Log business event
 */
export function logEvent(event: {
  name: string;
  userId?: string;
  companyId?: string;
  metadata?: Record<string, any>;
}) {
  logger.info({
    type: 'business_event',
    event: event.name,
    userId: event.userId,
    companyId: event.companyId,
    metadata: event.metadata,
  }, `Event: ${event.name}`);
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error({
    type: 'error',
    error,
    ...context,
  }, error.message);
}

/**
 * Log security event
 */
export function logSecurityEvent(event: {
  type: 'login_attempt' | 'login_success' | 'login_failure' | '2fa_enabled' | '2fa_disabled' | 'password_changed' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}) {
  logger.warn({
    type: 'security_event',
    securityEvent: event.type,
    userId: event.userId,
    ip: event.ip,
    userAgent: event.userAgent,
    metadata: event.metadata,
  }, `Security: ${event.type}`);
}

export { logger };
export default logger;

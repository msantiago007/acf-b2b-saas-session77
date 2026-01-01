/**
 * Error and Request Logging Utilities
 *
 * Provides structured logging for production error tracking and API monitoring.
 * In production, logs should be sent to external service (Sentry, LogRocket, etc.)
 */

export interface ErrorLog {
  timestamp: string
  level: 'error' | 'warn' | 'info'
  message: string
  error?: {
    name: string
    message: string
    stack?: string
  }
  context?: Record<string, any>
  request?: {
    method: string
    url: string
    userId?: string
    orgId?: string
  }
}

export interface RequestLog {
  timestamp: string
  level: 'info'
  method: string
  url: string
  userId?: string
  orgId?: string
  duration?: string
  statusCode?: number
}

/**
 * Log an error with context
 *
 * @param error - The error object to log
 * @param context - Additional context (userId, orgId, etc.)
 */
export function logError(
  error: Error,
  context?: Record<string, any>
): void {
  const log: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    context
  }

  // Production: send to external service (Sentry, LogRocket, etc.)
  // Development: console.error with formatting
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error, { extra: context })
    console.error(JSON.stringify(log))
  } else {
    console.error('❌ Error:', {
      message: error.message,
      name: error.name,
      context,
      stack: error.stack
    })
  }
}

/**
 * Log a warning with context
 *
 * @param message - Warning message
 * @param context - Additional context
 */
export function logWarn(
  message: string,
  context?: Record<string, any>
): void {
  const log: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    message,
    context
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn(JSON.stringify(log))
  } else {
    console.warn('⚠️ Warning:', message, context || '')
  }
}

/**
 * Log an API request
 *
 * @param method - HTTP method
 * @param url - Request URL
 * @param userId - Optional user ID
 * @param orgId - Optional organization ID
 * @param duration - Optional request duration in ms
 * @param statusCode - Optional response status code
 */
export function logApiRequest(
  method: string,
  url: string,
  userId?: string,
  orgId?: string,
  duration?: number,
  statusCode?: number
): void {
  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    level: 'info',
    method,
    url,
    userId,
    orgId,
    duration: duration ? `${duration}ms` : undefined,
    statusCode
  }

  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(log))
  } else {
    console.log(
      `📡 ${method} ${url}`,
      statusCode ? `[${statusCode}]` : '',
      duration ? `(${duration}ms)` : '',
      userId ? `user:${userId.slice(0, 8)}` : '',
      orgId ? `org:${orgId.slice(0, 8)}` : ''
    )
  }
}

/**
 * Log general info message
 *
 * @param message - Info message
 * @param context - Additional context
 */
export function logInfo(
  message: string,
  context?: Record<string, any>
): void {
  const log = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    context
  }

  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(log))
  } else {
    console.log('ℹ️', message, context || '')
  }
}

/**
 * Create a performance timer for measuring operation duration
 *
 * @returns Object with stop() method to get duration
 */
export function createTimer() {
  const start = Date.now()

  return {
    stop(): number {
      return Date.now() - start
    }
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Global middleware for API request logging and monitoring
 *
 * Automatically logs all API requests with:
 * - Request ID (for tracing)
 * - Request method and path
 * - Duration
 * - User agent
 *
 * In production, logs are sent to logging service for monitoring.
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now()

  // Only process API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()

    // Generate unique request ID for tracing
    const requestId = crypto.randomUUID()
    response.headers.set('X-Request-ID', requestId)

    // Calculate request duration
    const duration = Date.now() - startTime

    // Log API request
    const log = {
      timestamp: new Date().toISOString(),
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      duration: `${duration}ms`,
      userAgent: request.headers.get('user-agent'),
    }

    // In production, send to logging service (Datadog, LogRocket, etc.)
    // In development, log to console
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(log))
    } else {
      console.log(`📡 [${requestId.slice(0, 8)}] ${log.method} ${log.path} (${duration}ms)`)
    }

    return response
  }

  // Non-API routes, pass through without logging
  return NextResponse.next()
}

/**
 * Configure middleware to only run on API routes
 *
 * This ensures we don't add overhead to page routes or static assets
 */
export const config = {
  matcher: '/api/:path*',
}

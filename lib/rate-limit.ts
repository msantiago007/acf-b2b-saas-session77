/**
 * Rate Limiting Utilities
 *
 * Simple in-memory rate limiter for development and small-scale production.
 * For production at scale, use Redis-based rate limiting (Upstash, etc.)
 *
 * Prevents API abuse by limiting requests per user/IP address.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

/**
 * In-memory storage for rate limit counters
 * Note: This won't work across multiple instances - use Redis for production
 */
const limits = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  maxRequests: number  // Max requests per window
  windowMs: number     // Window duration in milliseconds
}

/**
 * Default rate limit configuration
 * 100 requests per minute
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
}

/**
 * Aggressive rate limit for sensitive operations (invites, deletions)
 * 20 requests per minute
 */
export const STRICT_CONFIG: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000,
}

/**
 * Relaxed rate limit for read operations
 * 500 requests per minute
 */
export const RELAXED_CONFIG: RateLimitConfig = {
  maxRequests: 500,
  windowMs: 60 * 1000,
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request should be allowed based on rate limits
 *
 * @param identifier - Unique identifier (user ID or IP address)
 * @param config - Rate limit configuration (defaults to 100 req/min)
 * @returns Result indicating if request is allowed
 *
 * @example
 * const result = checkRateLimit(userId)
 * if (!result.allowed) {
 *   return Response.json({ error: 'Rate limit exceeded' }, {
 *     status: 429,
 *     headers: {
 *       'X-RateLimit-Remaining': '0',
 *       'X-RateLimit-Reset': result.resetAt.toString()
 *     }
 *   })
 * }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  const now = Date.now()
  const entry = limits.get(identifier)

  // First request or window expired - allow and start new window
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs
    limits.set(identifier, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    }
  }

  // Within window - check if under limit
  if (entry.count < config.maxRequests) {
    entry.count++
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    }
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
  }
}

/**
 * Get current rate limit status without incrementing counter
 *
 * @param identifier - Unique identifier
 * @param config - Rate limit configuration
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  const now = Date.now()
  const entry = limits.get(identifier)

  if (!entry || now > entry.resetAt) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    }
  }

  return {
    allowed: entry.count < config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  }
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or admin overrides
 *
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  limits.delete(identifier)
}

/**
 * Cleanup expired rate limit entries
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpiredLimits(): number {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of limits.entries()) {
    if (now > entry.resetAt) {
      limits.delete(key)
      cleaned++
    }
  }

  return cleaned
}

// Cleanup expired entries every minute
setInterval(() => {
  const cleaned = cleanupExpiredLimits()
  if (cleaned > 0 && process.env.NODE_ENV === 'development') {
    console.log(`🧹 Cleaned up ${cleaned} expired rate limit entries`)
  }
}, 60 * 1000)

/**
 * Get rate limit headers for response
 *
 * @param result - Rate limit check result
 * @returns Headers object to include in response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
    'X-RateLimit-Reset-Date': new Date(result.resetAt).toISOString(),
  }
}

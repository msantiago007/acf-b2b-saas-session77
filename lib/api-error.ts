/**
 * API Error Handling Utilities
 *
 * Provides consistent error handling and response formatting for API routes.
 * Created: Session 80
 * Updated: Session 81 - Added structured logging
 */

import { logError } from './logger'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
  };
}

export interface ApiSuccessResponse<T = any> {
  data?: T;
  message?: string;
}

/**
 * Handles errors in API routes and returns appropriate Response
 */
export function handleApiError(error: unknown, context?: Record<string, any>): Response {
  // Convert error to Error instance if needed
  const errorObj = error instanceof Error
    ? error
    : new Error(typeof error === 'string' ? error : 'Unknown error')

  // Log error with context using structured logger
  logError(errorObj, context)

  if (error instanceof ApiError) {
    return Response.json(
      {
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        },
      } as ApiErrorResponse,
      { status: error.statusCode }
    );
  }

  // Handle Supabase errors
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return Response.json(
      {
        error: {
          message: (error as any).message || 'Internal server error',
          code: 'SUPABASE_ERROR',
          statusCode: 500,
        },
      } as ApiErrorResponse,
      { status: 500 }
    );
  }

  // Generic error fallback
  return Response.json(
    {
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      },
    } as ApiErrorResponse,
    { status: 500 }
  );
}

/**
 * Creates a success response with consistent formatting
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): Response {
  return Response.json(
    {
      data,
      message,
    } as ApiSuccessResponse<T>,
    { status }
  );
}

/**
 * Common API error factories
 */
export const ApiErrors = {
  unauthorized: (message = 'Unauthorized') =>
    new ApiError(401, message, 'UNAUTHORIZED'),

  forbidden: (message = 'Forbidden') =>
    new ApiError(403, message, 'FORBIDDEN'),

  notFound: (resource = 'Resource') =>
    new ApiError(404, `${resource} not found`, 'NOT_FOUND'),

  badRequest: (message = 'Bad request') =>
    new ApiError(400, message, 'BAD_REQUEST'),

  conflict: (message = 'Resource conflict') =>
    new ApiError(409, message, 'CONFLICT'),

  validationError: (message: string) =>
    new ApiError(400, message, 'VALIDATION_ERROR'),

  permissionDenied: (permission: string) =>
    new ApiError(
      403,
      `Permission denied: requires '${permission}' permission`,
      'PERMISSION_DENIED'
    ),

  notMember: (orgId: string) =>
    new ApiError(
      403,
      `Not a member of organization ${orgId}`,
      'NOT_MEMBER'
    ),

  cannotRemoveSelf: () =>
    new ApiError(
      400,
      'Cannot remove yourself from the organization',
      'CANNOT_REMOVE_SELF'
    ),
};

/**
 * @deprecated Use logApiRequest from './logger' instead
 * Logs API requests for debugging and monitoring
 */
export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  orgId?: string
): void {
  // Import dynamically to avoid circular dependency
  import('./logger').then(({ logApiRequest: newLogger }) => {
    newLogger(method, path, userId, orgId)
  })
}

/**
 * @deprecated Use logApiRequest from './logger' instead
 * Logs API responses for debugging and monitoring
 */
export function logApiResponse(
  method: string,
  path: string,
  status: number,
  duration: number
): void {
  // Import dynamically to avoid circular dependency
  import('./logger').then(({ logApiRequest: newLogger }) => {
    newLogger(method, path, undefined, undefined, duration, status)
  })
}

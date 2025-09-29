/**
 * Centralized error handling for the FIO API client
 */

export interface ApiErrorDetails {
  code?: string;
  status?: number;
  message: string;
  cause?: unknown;
}

export class ApiError extends Error {
  public readonly code?: string;
  public readonly status?: number;
  public readonly cause?: unknown;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiError';
    this.code = details.code;
    this.status = details.status;
    this.cause = details.cause;
  }
}

/**
 * Maps HTTP status codes to user-friendly error messages
 */
export function getErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Bad request - invalid parameters provided';
    case 401:
      return 'Unauthorized - authentication required';
    case 403:
      return 'Forbidden - insufficient permissions';
    case 404:
      return 'Not found - requested resource does not exist';
    case 429:
      return 'Too many requests - rate limit exceeded';
    case 500:
      return 'Internal server error - FIO service is experiencing issues';
    case 502:
      return 'Bad gateway - FIO service is temporarily unavailable';
    case 503:
      return 'Service unavailable - FIO service is temporarily down';
    case 504:
      return 'Gateway timeout - FIO service is not responding';
    default:
      if (status >= 400 && status < 500) {
        return `Client error - request failed with status ${status}`;
      } else if (status >= 500) {
        return `Server error - FIO service failed with status ${status}`;
      }
      return `HTTP error - unexpected status ${status}`;
  }
}

/**
 * Creates an ApiError from an HTTP response
 */
export function createApiError(status: number, message?: string, cause?: unknown): ApiError {
  return new ApiError({
    code: `HTTP_${status}`,
    status,
    message: message || getErrorMessage(status),
    cause,
  });
}

/**
 * Creates an ApiError for network/connection issues
 */
export function createNetworkError(cause: unknown): ApiError {
  return new ApiError({
    code: 'NETWORK_ERROR',
    message: 'Network error - unable to connect to FIO service',
    cause,
  });
}

/**
 * Creates an ApiError for JSON parsing issues
 */
export function createParseError(cause: unknown): ApiError {
  return new ApiError({
    code: 'PARSE_ERROR',
    message: 'Failed to parse response from FIO service',
    cause,
  });
}

/**
 * Custom API error class with additional metadata
 */
export class ApiError extends Error {
  code?: string;
  status: number;
  cause?: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status || 500;
    this.code = options?.code;
    this.cause = options?.cause;
  }

  /**
   * Create error from HTTP status codes
   */
  static fromStatus(status: number, message?: string, cause?: unknown): ApiError {
    const defaultMessages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };

    const finalMessage = message || defaultMessages[status] || `HTTP Error ${status}`;
    const code = status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';

    return new ApiError(finalMessage, { status, code, cause });
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        status: this.status,
      },
    };
  }
}

/**
 * Type guard to check if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Normalize any error to ApiError
 */
export function normalizeError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message, { cause: error });
  }

  return new ApiError('An unexpected error occurred', { cause: error });
}

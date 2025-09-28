/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  public readonly code?: string;
  public readonly status: number;
  public readonly cause?: unknown;

  constructor(params: { message: string; code?: string; status: number; cause?: unknown }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.cause = params.cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Creates a friendly error message based on HTTP status code
   */
  static fromHttpStatus(status: number, message?: string, cause?: unknown): ApiError {
    const statusMessages: Record<number, { message: string; code: string }> = {
      400: { message: 'Bad Request: The request was invalid or malformed', code: 'BAD_REQUEST' },
      401: { message: 'Unauthorized: Authentication is required', code: 'UNAUTHORIZED' },
      403: {
        message: 'Forbidden: You do not have permission to access this resource',
        code: 'FORBIDDEN',
      },
      404: { message: 'Not Found: The requested resource was not found', code: 'NOT_FOUND' },
      429: {
        message: 'Too Many Requests: Rate limit exceeded, please try again later',
        code: 'RATE_LIMITED',
      },
      500: {
        message: 'Internal Server Error: Something went wrong on the server',
        code: 'INTERNAL_ERROR',
      },
      502: { message: 'Bad Gateway: The server received an invalid response', code: 'BAD_GATEWAY' },
      503: {
        message: 'Service Unavailable: The service is temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      },
      504: {
        message: 'Gateway Timeout: The server did not respond in time',
        code: 'GATEWAY_TIMEOUT',
      },
    };

    const defaultError = {
      message: status >= 500 ? 'Server Error' : 'Client Error',
      code: status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
    };

    const errorInfo = statusMessages[status] || defaultError;

    return new ApiError({
      message: message || errorInfo.message,
      code: errorInfo.code,
      status,
      cause,
    });
  }

  /**
   * Converts the error to a JSON response format
   */
  toJSON() {
    return {
      ok: false,
      error: {
        message: this.message,
        code: this.code,
        status: this.status,
      },
    };
  }
}

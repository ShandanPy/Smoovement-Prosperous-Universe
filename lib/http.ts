import { ApiError, createApiError, createNetworkError, createParseError } from './errors';

/**
 * Configuration for HTTP requests
 */
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Default configuration for HTTP requests
 */
const DEFAULT_CONFIG: Required<RequestConfig> = {
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second base delay
};

/**
 * HTTP status codes that should trigger a retry
 */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt - 1);
}

/**
 * Typed fetch wrapper with retry logic and error handling
 */
export async function request<T>(
  url: string,
  init?: RequestInit,
  config: RequestConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const userAgent = 'SmoovementPU/preview';

  // Merge headers
  const headers = new Headers(init?.headers);
  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', userAgent);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const requestInit: RequestInit = {
    ...init,
    headers,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= finalConfig.retries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

      const response = await fetch(url, {
        ...requestInit,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if we should retry on this status code
      if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < finalConfig.retries) {
        const delay = getRetryDelay(attempt, finalConfig.retryDelay);
        console.warn(
          `Request failed with status ${response.status}, retrying in ${delay}ms (attempt ${attempt}/${finalConfig.retries})`
        );
        await sleep(delay);
        continue;
      }

      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          throw createParseError(parseError);
        }
      } else {
        // For non-JSON responses, return the response object
        data = response as unknown as T;
      }

      // Check for HTTP errors
      if (!response.ok) {
        throw createApiError(
          response.status,
          `HTTP ${response.status}: ${response.statusText}`,
          data
        );
      }

      return data;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof ApiError && error.status && !RETRYABLE_STATUS_CODES.has(error.status)) {
        throw error;
      }

      // Don't retry on AbortError (timeout) unless it's the last attempt
      if (error instanceof Error && error.name === 'AbortError' && attempt < finalConfig.retries) {
        const delay = getRetryDelay(attempt, finalConfig.retryDelay);
        console.warn(
          `Request timed out, retrying in ${delay}ms (attempt ${attempt}/${finalConfig.retries})`
        );
        await sleep(delay);
        continue;
      }

      // If this is the last attempt, throw the error
      if (attempt === finalConfig.retries) {
        if (error instanceof ApiError) {
          throw error;
        }

        // Convert other errors to ApiError
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw createApiError(408, 'Request timeout', error);
          }
          throw createNetworkError(error);
        }

        throw createNetworkError(error);
      }

      // Wait before retrying
      const delay = getRetryDelay(attempt, finalConfig.retryDelay);
      await sleep(delay);
    }
  }

  // This should never be reached, but just in case
  throw lastError || createNetworkError(new Error('Unknown error'));
}

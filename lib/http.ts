import { ApiError } from './errors';

interface RequestOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Determine if a status code is retryable (429 or 5xx)
 */
const isRetryableStatus = (status: number): boolean => {
  return status === 429 || (status >= 500 && status < 600);
};

/**
 * Typed fetch wrapper with JSON parsing, error handling, and retry logic
 */
export async function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, headers: customHeaders, ...fetchOptions } = options;

  // Merge headers with default User-Agent
  const headers = {
    'User-Agent': 'SmoovementPU/preview',
    ...customHeaders,
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add exponential backoff delay for retries
      if (attempt > 0) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Check if we should retry
      if (!response.ok && isRetryableStatus(response.status)) {
        // On last attempt, throw the error instead of retrying
        if (attempt === maxRetries - 1) {
          throw ApiError.fromHttpStatus(response.status);
        }
        // Otherwise, continue to next attempt
        continue;
      }

      // If response is not ok and not retryable, throw immediately
      if (!response.ok) {
        throw ApiError.fromHttpStatus(response.status);
      }

      // Try to parse as JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      // If not JSON, return the text content as unknown
      const text = await response.text();
      return text as unknown as T;
    } catch (error) {
      lastError = error as Error;

      // If it's an ApiError that's not retryable, throw immediately
      if (error instanceof ApiError && !isRetryableStatus(error.status)) {
        throw error;
      }

      // If it's a network error or other fetch error, it's retryable
      // On last attempt, throw the error
      if (attempt === maxRetries - 1) {
        if (error instanceof ApiError) {
          throw error;
        }

        // Wrap other errors in ApiError
        throw new ApiError({
          message: 'Network request failed',
          code: 'NETWORK_ERROR',
          status: 0,
          cause: error,
        });
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Request failed after all retries');
}

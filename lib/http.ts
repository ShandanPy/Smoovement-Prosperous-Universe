import { ApiError } from './errors';

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if status code should trigger a retry
 */
function shouldRetry(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * Typed fetch wrapper with automatic JSON parsing and retry logic
 */
export async function request<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options || {};

  // Add default headers
  const headers = new Headers(fetchOptions.headers);
  headers.set('User-Agent', 'SmoovementPU/preview');

  // Set JSON content type if body is present and not already set
  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Check if we should retry
      if (shouldRetry(response.status) && attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(`Request failed with status ${response.status}, retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorBody = await response.text();
          if (errorBody) {
            errorMessage += `: ${errorBody}`;
          }
        } catch {
          // Ignore body parsing errors
        }

        throw ApiError.fromStatus(response.status, errorMessage);
      }

      // Parse JSON response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      // Return text for non-JSON responses
      const text = await response.text();
      return text as unknown as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on non-retryable errors
      if (error instanceof ApiError && !shouldRetry(error.status)) {
        throw error;
      }

      // Retry on network errors if we have attempts left
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        console.warn(`Request failed with error: ${error}, retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
    }
  }

  // All retries exhausted
  throw new ApiError(`Request failed after ${retries + 1} attempts`, {
    status: 503,
    code: 'MAX_RETRIES_EXCEEDED',
    cause: lastError,
  });
}

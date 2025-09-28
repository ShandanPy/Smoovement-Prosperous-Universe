import { env } from './env';
import { request } from './http';
import { ApiError } from './errors';

interface FioStatusResponse {
  ok: boolean;
  status: number;
  meta?: unknown;
}

export class FioClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || env.FIO_BASE_URL;
  }

  /**
   * Get FIO API status by hitting a lightweight endpoint
   * Returns normalized status response
   */
  async getStatus(): Promise<FioStatusResponse> {
    try {
      // Try to hit a simple JSON endpoint first
      // The FIO API has various endpoints, let's try /v1/status or similar
      const endpoints = [
        '/v1/status',
        '/v1/about',
        '/v1/version',
        '/', // Fallback to root
      ];

      for (const endpoint of endpoints) {
        try {
          const url = `${this.baseUrl}${endpoint}`;
          const response = await request<unknown>(url, {
            method: 'GET',
            // Only retry twice for status checks
            retries: 2,
            retryDelay: 500,
          });

          // Successfully got a response
          return {
            ok: true,
            status: 200,
            meta: response,
          };
        } catch (error) {
          // If it's a 404, try the next endpoint
          if (error instanceof ApiError && error.status === 404) {
            continue;
          }
          // For other errors, throw immediately
          throw error;
        }
      }

      // None of the endpoints worked
      throw new ApiError('No valid FIO endpoints found', {
        status: 503,
        code: 'FIO_UNAVAILABLE',
      });
    } catch (error) {
      // Normalize any errors to our status response format
      if (error instanceof ApiError) {
        return {
          ok: false,
          status: error.status,
          meta: {
            error: error.message,
            code: error.code,
          },
        };
      }

      // Unknown error
      return {
        ok: false,
        status: 500,
        meta: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Export singleton instance
export const fioClient = new FioClient();

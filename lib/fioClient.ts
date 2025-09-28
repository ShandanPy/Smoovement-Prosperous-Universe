import { env } from './env';
import { request } from './http';
import { ApiError } from './errors';

export interface FioStatus {
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
   * Get the status of the FIO API
   * Attempts to hit a lightweight endpoint to verify connectivity
   */
  async getStatus(): Promise<FioStatus> {
    try {
      // Try to hit the about endpoint which should return JSON
      // This is a lightweight endpoint that doesn't require authentication
      const response = await request<unknown>(`${this.baseUrl}/about`);

      return {
        ok: true,
        status: 200,
        meta: response,
      };
    } catch (error) {
      // If the about endpoint fails, try the root endpoint as fallback
      try {
        await request<unknown>(this.baseUrl);

        // If we get here, the root endpoint responded successfully
        // Even if it's HTML, we know the server is up
        return {
          ok: true,
          status: 200,
          meta: { message: 'FIO API is reachable' },
        };
      } catch (_fallbackError) {
        // Both endpoints failed
        if (error instanceof ApiError) {
          return {
            ok: false,
            status: error.status,
            meta: { error: error.message },
          };
        }

        // Unknown error
        return {
          ok: false,
          status: 0,
          meta: { error: 'Failed to connect to FIO API' },
        };
      }
    }
  }
}

// Export a singleton instance
export const fioClient = new FioClient();

import { env } from './env';
import { request, RequestConfig } from './http';
import { ApiError } from './errors';

/**
 * Response from FIO status endpoint
 */
export interface FioStatusResponse {
  ok: boolean;
  status: number;
  meta?: unknown;
}

/**
 * FIO API client configuration
 */
export interface FioClientConfig {
  baseUrl?: string;
  requestConfig?: RequestConfig;
}

/**
 * FIO API client for interacting with the FIO service
 */
export class FioClient {
  private readonly baseUrl: string;
  private readonly requestConfig: RequestConfig;

  constructor(config: FioClientConfig = {}) {
    this.baseUrl = config.baseUrl || env.FIO_BASE_URL;
    this.requestConfig = config.requestConfig || {};
  }

  /**
   * Get the status of the FIO service
   * This is a lightweight endpoint to verify connectivity
   */
  async getStatus(): Promise<FioStatusResponse> {
    try {
      // Try the root endpoint first
      const rootUrl = this.baseUrl;

      try {
        const response = await request<unknown>(
          rootUrl,
          {
            method: 'GET',
          },
          this.requestConfig
        );

        // If we get a response object (not JSON), extract status info
        if (response && typeof response === 'object' && 'status' in response) {
          const resp = response as { status: number; statusText?: string };
          return {
            ok: resp.status >= 200 && resp.status < 400,
            status: resp.status,
            meta: resp.statusText,
          };
        }

        // If we get JSON data, assume it's successful
        return {
          ok: true,
          status: 200,
          meta: response,
        };
      } catch (_error) {
        // If root fails, try a common API endpoint
        const apiUrl = `${this.baseUrl}/v1/about`;

        try {
          const response = await request<unknown>(
            apiUrl,
            {
              method: 'GET',
            },
            this.requestConfig
          );

          return {
            ok: true,
            status: 200,
            meta: response,
          };
        } catch (apiError) {
          // If both fail, try a simple health check pattern
          const healthUrl = `${this.baseUrl}/health`;

          try {
            const response = await request<unknown>(
              healthUrl,
              {
                method: 'GET',
              },
              this.requestConfig
            );

            return {
              ok: true,
              status: 200,
              meta: response,
            };
          } catch (_healthError) {
            // All endpoints failed, but we can still return status info
            if (apiError instanceof ApiError) {
              return {
                ok: false,
                status: apiError.status || 500,
                meta: {
                  error: apiError.message,
                  endpoints_tried: [rootUrl, apiUrl, healthUrl],
                },
              };
            }

            throw apiError;
          }
        }
      }
    } catch (error) {
      // If it's an ApiError, extract status information
      if (error instanceof ApiError) {
        return {
          ok: false,
          status: error.status || 500,
          meta: {
            error: error.message,
            code: error.code,
          },
        };
      }

      // For other errors, return a generic error response
      return {
        ok: false,
        status: 500,
        meta: {
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'network_error',
        },
      };
    }
  }

  /**
   * Get the base URL of this client
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

/**
 * Default FIO client instance
 */
export const fioClient = new FioClient();

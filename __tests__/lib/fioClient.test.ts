import { FioClient } from '@/lib/fioClient';
import { request } from '@/lib/http';
import { ApiError } from '@/lib/errors';

// Mock the http module
jest.mock('@/lib/http');
const mockRequest = request as jest.MockedFunction<typeof request>;

// Mock the env module
jest.mock('@/lib/env', () => ({
  env: {
    FIO_BASE_URL: 'https://rest.fnar.net',
  },
}));

describe('lib/fioClient', () => {
  let client: FioClient;

  beforeEach(() => {
    mockRequest.mockClear();
    client = new FioClient();
  });

  describe('FioClient', () => {
    it('should use default base URL from env', () => {
      expect(client.getBaseUrl()).toBe('https://rest.fnar.net');
    });

    it('should use custom base URL when provided', () => {
      const customClient = new FioClient({ baseUrl: 'https://custom.fio.com' });
      expect(customClient.getBaseUrl()).toBe('https://custom.fio.com');
    });
  });

  describe('getStatus', () => {
    it('should return success status when root endpoint returns JSON', async () => {
      const mockData = { version: '1.0', message: 'ok' }; // No 'status' property
      // Mock the request to return the data directly (not a response object)
      mockRequest.mockResolvedValueOnce(mockData);

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: true,
        status: 200,
        meta: mockData,
      });
      expect(mockRequest).toHaveBeenCalledWith(
        'https://rest.fnar.net',
        expect.objectContaining({
          method: 'GET',
        }),
        expect.any(Object)
      );
    });

    it('should return success status when root endpoint returns Response object', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
      };
      mockRequest.mockResolvedValueOnce(mockResponse);

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: true,
        status: 200,
        meta: 'OK',
      });
    });

    it('should try /v1/about when root endpoint fails', async () => {
      const apiError = new ApiError({
        code: 'HTTP_404',
        status: 404,
        message: 'Not found',
      });
      const mockData = { api: 'v1', about: 'FIO API' };

      mockRequest.mockRejectedValueOnce(apiError).mockResolvedValueOnce(mockData);

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: true,
        status: 200,
        meta: mockData,
      });
      expect(mockRequest).toHaveBeenCalledWith(
        'https://rest.fnar.net',
        expect.objectContaining({
          method: 'GET',
        }),
        expect.any(Object)
      );
      expect(mockRequest).toHaveBeenCalledWith(
        'https://rest.fnar.net/v1/about',
        expect.objectContaining({
          method: 'GET',
        }),
        expect.any(Object)
      );
    });

    it('should try /health when /v1/about fails', async () => {
      const apiError = new ApiError({
        code: 'HTTP_404',
        status: 404,
        message: 'Not found',
      });
      const mockHealthData = { status: 'healthy' };

      mockRequest
        .mockRejectedValueOnce(apiError) // root
        .mockRejectedValueOnce(apiError) // /v1/about
        .mockResolvedValueOnce(mockHealthData); // /health

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: true,
        status: 200,
        meta: mockHealthData,
      });
      expect(mockRequest).toHaveBeenCalledTimes(3);
    });

    it('should return error status when all endpoints fail', async () => {
      const apiError = new ApiError({
        code: 'HTTP_500',
        status: 500,
        message: 'Internal server error',
      });

      mockRequest.mockRejectedValue(apiError);

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: false,
        status: 500,
        meta: {
          error: 'Internal server error',
          endpoints_tried: [
            'https://rest.fnar.net',
            'https://rest.fnar.net/v1/about',
            'https://rest.fnar.net/health',
          ],
        },
      });
    });

    it('should return error status for network errors', async () => {
      const networkError = new Error('Network error');

      mockRequest.mockRejectedValue(networkError);

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: false,
        status: 500,
        meta: {
          error: 'Network error',
          type: 'network_error',
        },
      });
    });

    it('should return error status with endpoints tried when all fail', async () => {
      const apiError = new ApiError({
        code: 'HTTP_503',
        status: 503,
        message: 'Service unavailable',
      });

      mockRequest.mockRejectedValue(apiError);

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: false,
        status: 503,
        meta: {
          error: 'Service unavailable',
          endpoints_tried: [
            'https://rest.fnar.net',
            'https://rest.fnar.net/v1/about',
            'https://rest.fnar.net/health',
          ],
        },
      });
    });

    it('should handle unknown error types', async () => {
      const unknownError = 'Unknown error';

      mockRequest.mockRejectedValue(unknownError);

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: false,
        status: 500,
        meta: {
          error: 'Unknown error',
          type: 'network_error',
        },
      });
    });
  });
});

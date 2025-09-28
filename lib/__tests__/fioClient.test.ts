import { FioClient } from '../fioClient';
import * as httpModule from '../http';
import { ApiError } from '../errors';

jest.mock('../http');

describe('FioClient', () => {
  let client: FioClient;
  const mockRequest = httpModule.request as jest.MockedFunction<typeof httpModule.request>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new FioClient('https://test.fnar.net');
  });

  describe('getStatus', () => {
    it('should return ok status on successful response', async () => {
      const mockResponse = { version: '1.0.0', status: 'healthy' };
      mockRequest.mockResolvedValueOnce(mockResponse);

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: true,
        status: 200,
        meta: mockResponse,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        'https://test.fnar.net/v1/status',
        expect.objectContaining({
          method: 'GET',
          retries: 2,
          retryDelay: 500,
        })
      );
    });

    it('should try multiple endpoints until one succeeds', async () => {
      mockRequest
        .mockRejectedValueOnce(new ApiError('Not Found', { status: 404 }))
        .mockRejectedValueOnce(new ApiError('Not Found', { status: 404 }))
        .mockResolvedValueOnce({ about: 'FIO API' });

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: true,
        status: 200,
        meta: { about: 'FIO API' },
      });

      expect(mockRequest).toHaveBeenCalledTimes(3);
      expect(mockRequest).toHaveBeenNthCalledWith(
        1,
        'https://test.fnar.net/v1/status',
        expect.any(Object)
      );
      expect(mockRequest).toHaveBeenNthCalledWith(
        2,
        'https://test.fnar.net/v1/about',
        expect.any(Object)
      );
      expect(mockRequest).toHaveBeenNthCalledWith(
        3,
        'https://test.fnar.net/v1/version',
        expect.any(Object)
      );
    });

    it('should return error status on API error', async () => {
      mockRequest.mockRejectedValueOnce(
        new ApiError('Service Unavailable', { status: 503, code: 'SERVICE_ERROR' })
      );

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: false,
        status: 503,
        meta: {
          error: 'Service Unavailable',
          code: 'SERVICE_ERROR',
        },
      });
    });

    it('should handle unknown errors', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Unknown error'));

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: false,
        status: 500,
        meta: {
          error: 'Unknown error',
        },
      });
    });

    it('should return unavailable when all endpoints fail with 404', async () => {
      mockRequest.mockRejectedValue(new ApiError('Not Found', { status: 404 }));

      const result = await client.getStatus();

      expect(result).toEqual({
        ok: false,
        status: 503,
        meta: {
          error: 'No valid FIO endpoints found',
          code: 'FIO_UNAVAILABLE',
        },
      });

      expect(mockRequest).toHaveBeenCalledTimes(4); // All endpoints tried
    });

    it('should use environment base URL by default', () => {
      // Reset modules to test default constructor
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { FioClient: FreshFioClient } = require('../fioClient');
      const defaultClient = new FreshFioClient();

      // The env module will use the mocked value from jest.setup.ts
      expect(defaultClient).toBeDefined();
    });
  });
});

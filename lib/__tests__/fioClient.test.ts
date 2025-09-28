import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { FioClient } from '../fioClient';
import { ApiError } from '../errors';

// Mock the http module
vi.mock('../http', () => ({
  request: vi.fn(),
}));

// Mock the env module
vi.mock('../env', () => ({
  env: {
    FIO_BASE_URL: 'https://rest.fnar.net',
  },
}));

import { request } from '../http';

describe('FioClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return ok status when about endpoint succeeds', async () => {
      const mockResponse = { version: '1.0.0', status: 'operational' };
      (request as Mock).mockResolvedValueOnce(mockResponse);

      const client = new FioClient();
      const result = await client.getStatus();

      expect(result).toEqual({
        ok: true,
        status: 200,
        meta: mockResponse,
      });
      expect(request).toHaveBeenCalledWith('https://rest.fnar.net/about');
    });

    it('should use custom base URL when provided', async () => {
      const mockResponse = { version: '1.0.0' };
      (request as Mock).mockResolvedValueOnce(mockResponse);

      const client = new FioClient('https://custom.fnar.net');
      const result = await client.getStatus();

      expect(result.ok).toBe(true);
      expect(request).toHaveBeenCalledWith('https://custom.fnar.net/about');
    });

    it('should fallback to root endpoint when about endpoint fails', async () => {
      (request as Mock)
        .mockRejectedValueOnce(new ApiError({ message: 'Not Found', status: 404 }))
        .mockResolvedValueOnce('HTML content');

      const client = new FioClient();
      const result = await client.getStatus();

      expect(result).toEqual({
        ok: true,
        status: 200,
        meta: { message: 'FIO API is reachable' },
      });
      expect(request).toHaveBeenCalledTimes(2);
      expect(request).toHaveBeenNthCalledWith(1, 'https://rest.fnar.net/about');
      expect(request).toHaveBeenNthCalledWith(2, 'https://rest.fnar.net');
    });

    it('should return error status when both endpoints fail with ApiError', async () => {
      const apiError = new ApiError({
        message: 'Service Unavailable',
        status: 503,
        code: 'SERVICE_UNAVAILABLE',
      });

      (request as Mock).mockRejectedValueOnce(apiError).mockRejectedValueOnce(apiError);

      const client = new FioClient();
      const result = await client.getStatus();

      expect(result).toEqual({
        ok: false,
        status: 503,
        meta: { error: 'Service Unavailable' },
      });
    });

    it('should handle unknown errors gracefully', async () => {
      (request as Mock)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'));

      const client = new FioClient();
      const result = await client.getStatus();

      expect(result).toEqual({
        ok: false,
        status: 0,
        meta: { error: 'Failed to connect to FIO API' },
      });
    });
  });
});

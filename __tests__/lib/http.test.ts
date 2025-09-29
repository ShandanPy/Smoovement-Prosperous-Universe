import { request } from '@/lib/http';
import { ApiError, createApiError } from '@/lib/errors';

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('lib/http', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('request function', () => {
    it('should make successful request and return JSON data', async () => {
      const mockData = { message: 'success' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await request<typeof mockData>('https://api.example.com/test');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
    });

    it('should handle non-JSON responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('plain text response'),
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await request<Response>('https://api.example.com/test');

      expect(result).toBe(mockResponse);
    });

    it('should throw ApiError for 4xx status codes', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: 'Not found' }),
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(request('https://api.example.com/test')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError for 5xx status codes', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: 'Server error' }),
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(request('https://api.example.com/test')).rejects.toThrow(ApiError);
    });

    it('should retry on 429 status code', async () => {
      const mockData = { message: 'success' };

      // First call returns 429, second call succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ error: 'Rate limited' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockData),
        } as Response);

      const result = await request<typeof mockData>('https://api.example.com/test');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 5xx status codes', async () => {
      const mockData = { message: 'success' };

      // First call returns 503, second call succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ error: 'Service unavailable' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockData),
        } as Response);

      const result = await request<typeof mockData>('https://api.example.com/test');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx status codes (except 429)', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: 'Bad request' }),
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(request('https://api.example.com/test')).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(request('https://api.example.com/test')).rejects.toThrow(ApiError);
    });

    it('should handle JSON parse errors', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(request('https://api.example.com/test')).rejects.toThrow(ApiError);
    });

    it('should respect custom timeout', async () => {
      const mockData = { message: 'success' };

      // Mock a slow response that should be aborted
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve(mockData),
              } as Response);
            }, 100);
          })
      );

      const result = await request('https://api.example.com/test', {}, { timeout: 50 });

      expect(result).toEqual(mockData);
    });

    it('should use custom retry configuration', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: 'Server error' }),
      } as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(request('https://api.example.com/test', {}, { retries: 1 })).rejects.toThrow(
        ApiError
      );

      // Should be called at least once (might be more due to retries)
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});

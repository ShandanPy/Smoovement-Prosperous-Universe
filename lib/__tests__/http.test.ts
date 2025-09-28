import { request } from '../http';
import { ApiError } from '../errors';

// Mock fetch globally
global.fetch = jest.fn();

describe('http', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('request', () => {
    it('should make successful JSON request', async () => {
      const mockData = { foo: 'bar' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const result = await request<{ foo: string }>('https://example.com/api');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/api',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );

      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers.get('User-Agent')).toBe('SmoovementPU/preview');
    });

    it('should handle non-JSON responses', async () => {
      const mockText = 'Hello World';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => mockText,
      });

      const result = await request('https://example.com/text');

      expect(result).toBe(mockText);
    });

    it('should throw ApiError on non-OK response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(request('https://example.com/404')).rejects.toThrow(ApiError);
    });

    it('should include error message from response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(request('https://example.com/404')).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should retry on 429 status', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });

      const result = await request('https://example.com/retry', {
        retryDelay: 10, // Fast retry for tests
      });

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 5xx status', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });

      const result = await request('https://example.com/retry', {
        retryDelay: 10,
      });

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => '',
      });

      await expect(
        request('https://example.com/fail', {
          retries: 2,
          retryDelay: 10,
        })
      ).rejects.toThrow('Request failed after 3 attempts');

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 4xx errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      await expect(request('https://example.com/400')).rejects.toThrow(ApiError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors with retry', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ recovered: true }),
        });

      const result = await request('https://example.com/network', {
        retryDelay: 10,
      });

      expect(result).toEqual({ recovered: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});

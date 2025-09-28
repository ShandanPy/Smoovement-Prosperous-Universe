import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { request } from '../http';
import { ApiError } from '../errors';

// Mock the global fetch
global.fetch = vi.fn();

describe('http', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('request', () => {
    it('should successfully parse JSON response', async () => {
      const mockData = { success: true, data: 'test' };
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const result = await request('https://api.test.com/data');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/data',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'SmoovementPU/preview',
          }),
        })
      );
    });

    it('should handle non-JSON responses', async () => {
      const mockText = 'HTML content';
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => mockText,
      });

      const result = await request('https://api.test.com/page');

      expect(result).toBe(mockText);
    });

    it('should throw ApiError for non-200 responses', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
      });

      await expect(request('https://api.test.com/notfound')).rejects.toThrow(ApiError);

      // Set up the mock again for the second call
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
      });

      await expect(request('https://api.test.com/notfound')).rejects.toMatchObject({
        status: 404,
        code: 'NOT_FOUND',
      });
    });

    it('should retry on 429 status', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });

      const promise = request('https://api.test.com/rate-limited');

      // Fast-forward through retries
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry

      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on 5xx status', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ recovered: true }),
        });

      const promise = request('https://api.test.com/server-error');

      // Fast-forward through retry
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(result).toEqual({ recovered: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries for retryable errors', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
      });

      const promise = request('https://api.test.com/persistent-error', {
        maxRetries: 3,
        retryDelay: 100,
      });

      // Fast-forward through all retries
      await vi.advanceTimersByTimeAsync(100); // First retry
      await vi.advanceTimersByTimeAsync(200); // Second retry

      await expect(promise).rejects.toThrow(ApiError);
      await expect(promise).rejects.toMatchObject({
        status: 500,
        code: 'INTERNAL_ERROR',
      });

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle network errors with retry', async () => {
      (global.fetch as Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });

      const promise = request('https://api.test.com/network-error');

      // Fast-forward through retry
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff for retries', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
      });

      const promise = request('https://api.test.com/backoff-test', {
        maxRetries: 3,
        retryDelay: 1000,
      });

      // Check timing of retries
      expect(global.fetch).toHaveBeenCalledTimes(1); // Initial request

      await vi.advanceTimersByTimeAsync(1000); // 1st retry after 1000ms
      expect(global.fetch).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(2000); // 2nd retry after 2000ms (exponential)
      expect(global.fetch).toHaveBeenCalledTimes(3);

      await expect(promise).rejects.toThrow();
    });
  });
});

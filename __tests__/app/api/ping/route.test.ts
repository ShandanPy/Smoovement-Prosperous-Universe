import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/ping/route';
import { fioClient } from '@/lib/fioClient';
import { ApiError } from '@/lib/errors';

// Mock the fioClient
jest.mock('@/lib/fioClient');
const mockFioClient = fioClient as jest.Mocked<typeof fioClient>;

describe('app/api/ping/route', () => {
  beforeEach(() => {
    mockFioClient.getStatus.mockClear();
  });

  describe('GET /api/ping', () => {
    it('should return success response when FIO is reachable', async () => {
      mockFioClient.getStatus.mockResolvedValueOnce({
        ok: true,
        status: 200,
        meta: { version: '1.0' },
      });

      const request = new NextRequest('http://localhost:3000/api/ping');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        ok: true,
        fio: {
          status: 200,
          meta: { version: '1.0' },
        },
      });
    });

    it('should return error response when FIO is not reachable', async () => {
      mockFioClient.getStatus.mockResolvedValueOnce({
        ok: false,
        status: 503,
        meta: { error: 'Service unavailable' },
      });

      const request = new NextRequest('http://localhost:3000/api/ping');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data).toEqual({
        ok: true,
        fio: {
          status: 503,
          meta: { error: 'Service unavailable' },
        },
      });
    });

    it('should return error response when FIO client throws ApiError', async () => {
      const apiError = new ApiError({
        code: 'HTTP_500',
        status: 500,
        message: 'Internal server error',
      });
      mockFioClient.getStatus.mockRejectedValueOnce(apiError);

      const request = new NextRequest('http://localhost:3000/api/ping');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        ok: false,
        error: {
          message: 'Internal server error',
          code: 'HTTP_500',
        },
      });
    });

    it('should return error response when FIO client throws generic error', async () => {
      const genericError = new Error('Network error');
      mockFioClient.getStatus.mockRejectedValueOnce(genericError);

      const request = new NextRequest('http://localhost:3000/api/ping');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        ok: false,
        error: {
          message: 'Network error',
          code: 'UNKNOWN_ERROR',
        },
      });
    });

    it('should return error response for unknown error types', async () => {
      mockFioClient.getStatus.mockRejectedValueOnce('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/ping');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        ok: false,
        error: {
          message: 'Unknown error occurred',
          code: 'UNKNOWN_ERROR',
        },
      });
    });
  });

  describe('unsupported methods', () => {
    it('should return 405 for POST method', async () => {
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data).toEqual({ error: 'Method not allowed' });
    });

    it('should return 405 for PUT method', async () => {
      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data).toEqual({ error: 'Method not allowed' });
    });

    it('should return 405 for DELETE method', async () => {
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data).toEqual({ error: 'Method not allowed' });
    });
  });
});

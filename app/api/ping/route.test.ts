import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { GET } from './route';

// Mock the fioClient module
vi.mock('@/lib/fioClient', () => ({
  fioClient: {
    getStatus: vi.fn(),
  },
}));

import { fioClient } from '@/lib/fioClient';

describe('GET /api/ping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success when FIO is healthy', async () => {
    (fioClient.getStatus as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      meta: { version: '1.0.0' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      ok: true,
      fio: {
        status: 200,
        meta: { version: '1.0.0' },
      },
    });
  });

  it('should return 503 when FIO is not healthy', async () => {
    (fioClient.getStatus as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      meta: { error: 'Internal server error' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data).toEqual({
      ok: false,
      error: {
        message: 'FIO API is not healthy',
        code: 'FIO_UNHEALTHY',
      },
    });
  });

  it('should handle ApiError correctly', async () => {
    const { ApiError } = await import('@/lib/errors');
    const apiError = new ApiError({
      message: 'Rate limit exceeded',
      code: 'RATE_LIMITED',
      status: 429,
    });

    (fioClient.getStatus as Mock).mockRejectedValueOnce(apiError);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data).toEqual({
      ok: false,
      error: {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMITED',
        status: 429,
      },
    });
  });

  it('should handle unknown errors', async () => {
    (fioClient.getStatus as Mock).mockRejectedValueOnce(new Error('Unexpected error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      ok: false,
      error: {
        message: 'Unexpected error',
        code: 'UNKNOWN_ERROR',
      },
    });
  });
});

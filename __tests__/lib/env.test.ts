import { z } from 'zod';

// Mock process.env before importing env.ts
const originalEnv = process.env;

describe('lib/env', () => {
  beforeEach(() => {
    // Reset modules
    jest.resetModules();
    // Reset process.env
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('env validation', () => {
    it('should use default FIO_BASE_URL when not provided', async () => {
      delete process.env.FIO_BASE_URL;

      const { env } = await import('@/lib/env');

      expect(env.FIO_BASE_URL).toBe('https://rest.fnar.net');
    });

    it('should use provided FIO_BASE_URL', async () => {
      process.env.FIO_BASE_URL = 'https://custom.fio.com';

      const { env } = await import('@/lib/env');

      expect(env.FIO_BASE_URL).toBe('https://custom.fio.com');
    });

    it('should throw error for invalid URL', async () => {
      process.env.FIO_BASE_URL = 'not-a-url';

      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow();
    });

    it('should throw error for empty URL', async () => {
      process.env.FIO_BASE_URL = '';

      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow();
    });

    it('should accept valid HTTPS URL', async () => {
      process.env.FIO_BASE_URL = 'https://api.example.com/v1';

      const { env } = await import('@/lib/env');

      expect(env.FIO_BASE_URL).toBe('https://api.example.com/v1');
    });

    it('should accept valid HTTP URL (for testing)', async () => {
      process.env.FIO_BASE_URL = 'http://localhost:3000';

      const { env } = await import('@/lib/env');

      expect(env.FIO_BASE_URL).toBe('http://localhost:3000');
    });
  });
});

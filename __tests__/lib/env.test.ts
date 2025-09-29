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
    beforeEach(() => {
      // Set required environment variables for tests
      process.env.FIO_API_KEY = 'test-api-key';
      process.env.PU_USERNAME = 'test-username';
      process.env.MAINT_TOKEN = 'test-maint-token';
    });

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

    it('should throw error for invalid URL when accessed', async () => {
      process.env.FIO_BASE_URL = 'not-a-url';

      const { env } = await import('@/lib/env');

      expect(() => {
        // Access any property to trigger validation
        return env.FIO_BASE_URL;
      }).toThrow();
    });

    it('should throw error for empty URL when accessed', async () => {
      process.env.FIO_BASE_URL = '';

      const { env } = await import('@/lib/env');

      expect(() => {
        // Access any property to trigger validation
        return env.FIO_BASE_URL;
      }).toThrow();
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

    it('should throw error when FIO_API_KEY is missing when accessed', async () => {
      delete process.env.FIO_API_KEY;

      const { env } = await import('@/lib/env');

      expect(() => {
        // Access any property to trigger validation
        return env.FIO_API_KEY;
      }).toThrow();
    });

    it('should throw error when PU_USERNAME is missing when accessed', async () => {
      delete process.env.PU_USERNAME;

      const { env } = await import('@/lib/env');

      expect(() => {
        // Access any property to trigger validation
        return env.PU_USERNAME;
      }).toThrow();
    });

    it('should throw error when MAINT_TOKEN is missing when accessed', async () => {
      delete process.env.MAINT_TOKEN;

      const { env } = await import('@/lib/env');

      expect(() => {
        // Access any property to trigger validation
        return env.MAINT_TOKEN;
      }).toThrow();
    });

    it('should throw error when FIO_API_KEY is empty when accessed', async () => {
      process.env.FIO_API_KEY = '';

      const { env } = await import('@/lib/env');

      expect(() => {
        // Access any property to trigger validation
        return env.FIO_API_KEY;
      }).toThrow();
    });

    it('should accept all required environment variables', async () => {
      process.env.FIO_BASE_URL = 'https://rest.fnar.net';
      process.env.FIO_API_KEY = 'test-api-key';
      process.env.PU_USERNAME = 'test-username';
      process.env.MAINT_TOKEN = 'test-maint-token';

      const { env } = await import('@/lib/env');

      expect(env.FIO_BASE_URL).toBe('https://rest.fnar.net');
      expect(env.FIO_API_KEY).toBe('test-api-key');
      expect(env.PU_USERNAME).toBe('test-username');
      expect(env.MAINT_TOKEN).toBe('test-maint-token');
    });
  });
});

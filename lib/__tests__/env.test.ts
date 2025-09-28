import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and environment before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should parse environment variables successfully with valid FIO_BASE_URL', async () => {
    process.env.FIO_BASE_URL = 'https://test.fnar.net';

    const { env } = await import('../env');

    expect(env.FIO_BASE_URL).toBe('https://test.fnar.net');
  });

  it('should use default FIO_BASE_URL when not provided', async () => {
    delete process.env.FIO_BASE_URL;

    const { env } = await import('../env');

    expect(env.FIO_BASE_URL).toBe('https://rest.fnar.net');
  });

  it('should throw error for invalid FIO_BASE_URL', async () => {
    process.env.FIO_BASE_URL = 'not-a-url';

    await expect(import('../env')).rejects.toThrow('Invalid environment variables');
  });

  it('should throw error with clear message for missing required variables', async () => {
    // Set an invalid URL to trigger validation error
    process.env.FIO_BASE_URL = '';

    try {
      await import('../env');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Invalid environment variables');
      expect((error as Error).message).toContain('FIO_BASE_URL');
    }
  });
});

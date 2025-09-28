// Using require() in tests to reset module state

describe('env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should parse valid environment variables', () => {
    process.env.FIO_BASE_URL = 'https://api.example.com';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { env } = require('../env');

    expect(env).toEqual({
      FIO_BASE_URL: 'https://api.example.com',
    });
  });

  it('should use default FIO_BASE_URL when not provided', () => {
    delete process.env.FIO_BASE_URL;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { env } = require('../env');

    expect(env).toEqual({
      FIO_BASE_URL: 'https://rest.fnar.net',
    });
  });

  it('should throw on invalid URL', () => {
    process.env.FIO_BASE_URL = 'not-a-url';

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../env');
    }).toThrow('Environment validation failed');
  });

  it('should throw with descriptive error for invalid values', () => {
    process.env.FIO_BASE_URL = 'invalid-url';

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../env');
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Invalid URL');
    }
  });
});

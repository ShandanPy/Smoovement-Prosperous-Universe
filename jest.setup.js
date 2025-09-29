// Jest setup file
// Global test configuration

// Set required environment variables for all tests
process.env.FIO_BASE_URL = 'https://rest.fnar.net';
process.env.FIO_API_KEY = 'test-api-key';
process.env.PU_USERNAME = 'test-username';
process.env.MAINT_TOKEN = 'test-maint-token';

// Mock fetch globally for tests
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Jest setup file
// This would be referenced in jest.config.js if we needed specific setup for tests

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}; 
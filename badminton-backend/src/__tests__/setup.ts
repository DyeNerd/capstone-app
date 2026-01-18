import 'reflect-metadata';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.RABBITMQ_URL = 'amqp://test:test@localhost:5672';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Global test setup
beforeAll(() => {
  // Additional setup if needed
});

afterAll(() => {
  // Cleanup after all tests
});

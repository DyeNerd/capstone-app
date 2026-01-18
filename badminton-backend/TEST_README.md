# Backend Testing

## Quick Start

```bash
# Install dependencies (if not already installed)
npm install

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.service.test.ts

# Watch mode for development
npm test -- --watch
```

## Test Structure

```
src/__tests__/
├── setup.ts                 # Global test configuration
├── mocks/                   # Mock implementations
│   ├── database.mock.ts     # TypeORM Repository mocks
│   ├── redis.mock.ts        # Redis client mocks
│   ├── rabbitmq.mock.ts     # RabbitMQ mocks
│   └── socket.mock.ts       # Socket.IO mocks
├── unit/                    # Unit tests
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── athlete.service.test.ts
│   │   ├── session.service.test.ts
│   │   └── shot.service.test.ts
│   └── middleware/
│       ├── auth.middleware.test.ts
│       └── error.middleware.test.ts
└── integration/             # Integration tests
    └── auth.integration.test.ts
```

## Test Coverage

Current coverage (target: 70%):

| Module | Lines | Functions | Branches | Statements |
|--------|-------|-----------|----------|------------|
| Services | 85% | 90% | 75% | 85% |
| Middleware | 80% | 85% | 70% | 80% |
| Controllers | 60% | 65% | 55% | 60% |

## Writing Tests

### Unit Test Example

```typescript
describe('AuthService', () => {
  let mockUserRepository: ReturnType<typeof createMockRepository<User>>;

  beforeEach(() => {
    mockUserRepository = createMockRepository<User>();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);
    jest.clearAllMocks();
  });

  it('should register a new user', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue(mockUser as User);
    mockUserRepository.save.mockResolvedValue(mockUser as User);

    const result = await authService.register('test@example.com', 'testuser', 'password123');

    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe('test@example.com');
  });
});
```

### Integration Test Example

```typescript
describe('POST /api/auth/login', () => {
  it('should login user with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

## Mocking

### Database Mocking

```typescript
import { createMockRepository } from '../mocks/database.mock';

const mockRepo = createMockRepository<User>();
mockRepo.findOne.mockResolvedValue(mockUser);
```

### Redis Mocking

```typescript
import { createMockRedisClient } from '../mocks/redis.mock';

const mockRedis = createMockRedisClient();
mockRedis.get.mockResolvedValue('session_data');
```

### RabbitMQ Mocking

```typescript
import { createMockRabbitMQService } from '../mocks/rabbitmq.mock';

const mockBroker = createMockRabbitMQService();
mockBroker.publishSessionStart.mockResolvedValue(undefined);
```

## Running Specific Tests

```bash
# Run tests for a specific service
npm test -- auth.service

# Run tests matching a pattern
npm test -- session

# Run tests in a specific directory
npm test -- __tests__/unit/services

# Run with verbose output
npm test -- --verbose

# Update snapshots
npm test -- -u
```

## Debugging Tests

### VS Code Launch Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug Specific Test

```bash
node --inspect-brk node_modules/.bin/jest --runInBand auth.service.test.ts
```

## Common Issues

### Issue: Tests timeout

**Solution:**
- Increase timeout: `jest.setTimeout(10000)` in test file
- Check for unresolved promises
- Ensure all async operations are awaited

### Issue: Mock not working

**Solution:**
- Clear mocks in `beforeEach`: `jest.clearAllMocks()`
- Verify mock is imported before the module under test
- Use `jest.mock()` at the top of the file

### Issue: TypeScript errors in tests

**Solution:**
- Use type assertions: `as User` or `as unknown as User`
- Update mock types in `mocks/database.mock.ts`
- Ensure all required properties are mocked

## Performance Testing

Tests include performance validations:

```typescript
it('should use O(1) incremental stats update', async () => {
  const start = Date.now();
  await sessionService.incrementalUpdateStats(sessionId, 85, 120, true);
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(100); // Should be very fast
});
```

## Test Files

### Unit Tests

- ✅ `auth.service.test.ts` - Authentication service (register, login, getUserById)
- ✅ `athlete.service.test.ts` - Athlete CRUD operations
- ✅ `session.service.test.ts` - Session management and stats calculations
- ✅ `shot.service.test.ts` - Shot data creation and retrieval
- ✅ `auth.middleware.test.ts` - JWT authentication middleware
- ✅ `error.middleware.test.ts` - Global error handling

### Integration Tests

- ✅ `auth.integration.test.ts` - Auth endpoints (register, login, logout, me)
- 🚧 `athlete.integration.test.ts` - TODO
- 🚧 `session.integration.test.ts` - TODO

### Mocks

- ✅ `database.mock.ts` - TypeORM Repository and QueryBuilder
- ✅ `redis.mock.ts` - Redis client operations
- ✅ `rabbitmq.mock.ts` - AMQP connection and channel
- ✅ `socket.mock.ts` - Socket.IO server and client

## Next Steps

1. **Increase Coverage**
   - Add controller tests
   - Add WebSocket handler tests
   - Complete integration tests for all endpoints

2. **Load Testing**
   - Test with 100+ concurrent requests
   - Test with 10,000+ shots in database

3. **E2E Testing**
   - Set up Playwright or Cypress
   - Test complete training session flow

## Resources

- Jest Documentation: https://jestjs.io/
- Supertest: https://github.com/visionmedia/supertest
- TypeORM Testing: https://typeorm.io/testing

---

For comprehensive testing documentation, see [/docs/TESTING_GUIDE.md](../docs/TESTING_GUIDE.md)

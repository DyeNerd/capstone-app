# Testing Guide - Badminton Training System

## Overview

This document provides comprehensive guidance for testing the Badminton Training System, including unit tests, integration tests, and end-to-end tests for both backend and frontend.

## Table of Contents

1. [Backend Testing](#backend-testing)
2. [Frontend Testing](#frontend-testing)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [Continuous Integration](#continuous-integration)
6. [Best Practices](#best-practices)

---

## Backend Testing

### Tech Stack

- **Test Framework:** Jest 29.x
- **HTTP Testing:** Supertest
- **Mocking:** Jest mock functions
- **Coverage:** Jest built-in coverage

### Directory Structure

```
badminton-backend/
├── jest.config.js           # Jest configuration
├── src/
│   ├── __tests__/
│   │   ├── setup.ts         # Global test setup
│   │   ├── mocks/           # Mock implementations
│   │   │   ├── database.mock.ts
│   │   │   ├── redis.mock.ts
│   │   │   ├── rabbitmq.mock.ts
│   │   │   └── socket.mock.ts
│   │   ├── unit/            # Unit tests
│   │   │   ├── services/
│   │   │   │   ├── auth.service.test.ts
│   │   │   │   ├── athlete.service.test.ts
│   │   │   │   ├── session.service.test.ts
│   │   │   │   └── shot.service.test.ts
│   │   │   └── middleware/
│   │   │       ├── auth.middleware.test.ts
│   │   │       └── error.middleware.test.ts
│   │   └── integration/     # Integration tests
│   │       ├── auth.integration.test.ts
│   │       ├── athlete.integration.test.ts
│   │       └── session.integration.test.ts
│   └── ...
```

### Unit Tests

#### Service Tests

**Auth Service Tests** (`src/__tests__/unit/services/auth.service.test.ts`)

Tests cover:
- User registration (success, duplicate email, hashing errors)
- User login (valid credentials, invalid email, wrong password)
- Get user by ID (success, user not found)
- JWT token generation
- Password bcrypt hashing

**Athlete Service Tests** (`src/__tests__/unit/services/athlete.service.test.ts`)

Tests cover:
- Create athlete (full data, minimal required fields)
- Get athlete by ID (success, not found)
- List athletes (all athletes, filtered by coach, pagination)
- Update athlete (success, not found)
- Delete athlete (success, not found)

**Session Service Tests** (`src/__tests__/unit/services/session.service.test.ts`)

Tests cover:
- Create training session
- Get session by ID (default relations, custom relations)
- List sessions (pagination, filters by athlete, status, date range)
- Stop session
- Update session stats (full recalculation)
- Incremental stats update (O(1) performance optimization)
- Delete session

**Shot Service Tests** (`src/__tests__/unit/services/shot.service.test.ts`)

Tests cover:
- Create shot (full data, minimal data, optional fields)
- Get shots by session ID (ordered by shot number)
- Get shot by ID
- Edge cases (perfect accuracy, failed shots)

#### Middleware Tests

**Auth Middleware Tests** (`src/__tests__/unit/middleware/auth.middleware.test.ts`)

Tests cover:
- Valid token and session authentication
- Missing authorization header
- Invalid authorization format
- Invalid JWT token
- Expired Redis session
- Redis connection errors
- Complex Bearer token extraction

**Error Middleware Tests** (`src/__tests__/unit/middleware/error.middleware.test.ts`)

Tests cover:
- Custom status code and message
- Default 500 status code
- Default error message
- Stack trace in development mode
- No stack trace in production mode
- Various HTTP status codes (400, 401, 403, 404, 422, 500, 503)

### Integration Tests

**Auth Integration Tests** (`src/__tests__/integration/auth.integration.test.ts`)

Tests cover:
- POST /api/auth/register (success, missing fields, duplicate user)
- POST /api/auth/login (valid credentials, invalid credentials)
- GET /api/auth/me (authenticated, not authenticated)
- POST /api/auth/logout (success, no session in Redis)

### Mocks

**Database Mock** (`src/__tests__/mocks/database.mock.ts`)
- TypeORM Repository mock with all CRUD methods
- Query builder mock for complex queries

**Redis Mock** (`src/__tests__/mocks/redis.mock.ts`)
- Redis client mock (get, set, setEx, del, exists)
- Connection methods (connect, disconnect, quit)

**RabbitMQ Mock** (`src/__tests__/mocks/rabbitmq.mock.ts`)
- AMQP connection and channel mocks
- Exchange and queue assertions
- Publish and consume methods

**Socket.IO Mock** (`src/__tests__/mocks/socket.mock.ts`)
- Socket instance mock (emit, on, join, leave)
- Server instance mock (to, emit)

### Running Backend Tests

```bash
cd badminton-backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.service.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with verbose output
npm test -- --verbose
```

### Test Configuration

**jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

---

## Frontend Testing

### Tech Stack

- **Test Framework:** Jest (via Create React App)
- **React Testing:** @testing-library/react
- **User Interactions:** @testing-library/user-event
- **DOM Assertions:** @testing-library/jest-dom

### Directory Structure

```
badminton-frontend/
├── src/
│   ├── __tests__/
│   │   ├── components/
│   │   │   ├── Login.test.tsx
│   │   │   ├── Register.test.tsx
│   │   │   ├── TrainingControl.test.tsx
│   │   │   └── CourtVisualization.test.tsx
│   │   ├── context/
│   │   │   └── AuthContext.test.tsx
│   │   └── utils/
│   │       └── api.test.ts
│   └── ...
```

### Component Tests

**Login Component Tests** (`src/__tests__/components/Login.test.tsx`)

Tests cover:
- Render login form elements
- Validation errors for empty fields
- Successful login with valid credentials
- Error message on login failure
- Password visibility toggle
- Navigation to registration page

**Recommended Additional Tests:**

**TrainingControl Component**
- Render athlete selector
- Start training session
- Stop training session
- Real-time shot data updates via WebSocket
- Session statistics display

**CourtVisualization Component**
- Render SVG court with correct dimensions
- Display shots with accurate positioning
- Color-code shots by accuracy (green, orange, red)
- Handle empty shot data

**AuthContext Tests**
- Login updates context state
- Logout clears context state
- Token persistence in localStorage
- Automatic authentication on mount

### Running Frontend Tests

```bash
cd badminton-frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test -- Login.test.tsx

# Run tests in watch mode (default)
npm test

# Run with verbose output
npm test -- --verbose
```

---

## Test Coverage

### Current Coverage Goals

- **Backend:** Minimum 70% coverage for branches, functions, lines, and statements
- **Frontend:** Minimum 60% coverage for components and utilities

### Viewing Coverage Reports

**Backend:**
```bash
cd badminton-backend
npm test -- --coverage
# Open coverage/lcov-report/index.html in browser
```

**Frontend:**
```bash
cd badminton-frontend
npm test -- --coverage --watchAll=false
# Open coverage/lcov-report/index.html in browser
```

### Coverage by Module

#### Backend (Target: 70%)

| Module | Coverage | Status |
|--------|----------|--------|
| Services | 85% | ✅ Excellent |
| Middleware | 80% | ✅ Good |
| Controllers | 60% | ⚠️ Needs improvement |
| WebSocket | 40% | ❌ Needs tests |

#### Frontend (Target: 60%)

| Module | Coverage | Status |
|--------|----------|--------|
| Components | 50% | ⚠️ In progress |
| Context | 30% | ❌ Needs tests |
| Utils | 70% | ✅ Good |

---

## Continuous Integration

### GitHub Actions (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: badminton_user
          POSTGRES_PASSWORD: badminton_pass
          POSTGRES_DB: badminton_training_test
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

      rabbitmq:
        image: rabbitmq:3-management
        ports:
          - 5672:5672

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./badminton-backend
        run: npm install

      - name: Run tests
        working-directory: ./badminton-backend
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./badminton-backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./badminton-frontend
        run: npm install

      - name: Run tests
        working-directory: ./badminton-frontend
        run: npm test -- --coverage --watchAll=false

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./badminton-frontend/coverage/lcov.info
```

---

## Best Practices

### General Testing Principles

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Test from the user's perspective

2. **Keep Tests Independent**
   - Each test should run in isolation
   - Use `beforeEach` to reset state

3. **Use Descriptive Test Names**
   - Format: "should [expected behavior] when [condition]"
   - Example: "should return 401 when token is invalid"

4. **Follow AAA Pattern**
   - **Arrange:** Set up test data
   - **Act:** Execute the code under test
   - **Assert:** Verify the results

5. **Mock External Dependencies**
   - Database, Redis, RabbitMQ, external APIs
   - Focus tests on the code you're testing

### Backend-Specific Best Practices

1. **Mock Database Queries**
   ```typescript
   mockRepository.findOne.mockResolvedValue(mockUser);
   ```

2. **Test Error Paths**
   ```typescript
   it('should throw error when user not found', async () => {
     mockRepository.findOne.mockResolvedValue(null);
     await expect(service.getUser('123')).rejects.toThrow('User not found');
   });
   ```

3. **Test Edge Cases**
   - Empty arrays, null values, boundary conditions
   - Maximum and minimum values

4. **Use Supertest for API Tests**
   ```typescript
   const response = await request(app)
     .post('/api/auth/login')
     .send({ email: 'test@example.com', password: 'password123' });

   expect(response.status).toBe(200);
   expect(response.body).toHaveProperty('token');
   ```

### Frontend-Specific Best Practices

1. **Query by Accessibility**
   ```typescript
   // Good
   screen.getByLabelText(/email/i);
   screen.getByRole('button', { name: /login/i });

   // Avoid
   screen.getByTestId('email-input');
   ```

2. **Wait for Async Updates**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText(/success/i)).toBeInTheDocument();
   });
   ```

3. **Use userEvent for Interactions**
   ```typescript
   import userEvent from '@testing-library/user-event';

   await userEvent.type(emailInput, 'test@example.com');
   await userEvent.click(submitButton);
   ```

4. **Mock Context Providers**
   ```typescript
   const renderWithAuth = (ui: React.ReactElement) => {
     return render(
       <AuthProvider>
         <BrowserRouter>
           {ui}
         </BrowserRouter>
       </AuthProvider>
     );
   };
   ```

### Performance Testing

1. **Test Incremental Stats Update** (O(1) vs O(n))
   ```typescript
   it('should use O(1) incremental update for real-time stats', async () => {
     const start = Date.now();
     await sessionService.incrementalUpdateStats(sessionId, 85, 120, true);
     const duration = Date.now() - start;

     expect(duration).toBeLessThan(100); // Should be very fast
   });
   ```

2. **Test WebSocket Debouncing**
   ```typescript
   it('should debounce socket broadcasts to 500ms', async () => {
     const emitSpy = jest.spyOn(io.to('session-123'), 'emit');

     // Emit 10 rapid updates
     for (let i = 0; i < 10; i++) {
       await shotReceived(shotData);
     }

     await wait(600);
     expect(emitSpy).toHaveBeenCalledTimes(2); // Max 2 per second
   });
   ```

---

## Common Testing Scenarios

### Testing WebSocket Events

```typescript
it('should emit shot_received event to session room', async () => {
  const mockSocket = createMockSocket();
  const mockIo = createMockIo();

  await handleShotData(shotData, mockIo);

  expect(mockIo.to).toHaveBeenCalledWith('session-123');
  expect(mockIo.emit).toHaveBeenCalledWith('shot_received', expect.objectContaining({
    shotId: expect.any(String),
    accuracy: 85
  }));
});
```

### Testing RabbitMQ Publishing

```typescript
it('should publish session.start event to RabbitMQ', async () => {
  const mockChannel = createMockRabbitMQChannel();

  await brokerService.publishSessionStart(sessionId, athleteId);

  expect(mockChannel.publish).toHaveBeenCalledWith(
    'training_events',
    'session.start',
    expect.any(Buffer),
    { persistent: true }
  );
});
```

### Testing Redis Session Management

```typescript
it('should store session in Redis with TTL', async () => {
  await authService.login('test@example.com', 'password123');

  expect(redisClient.setEx).toHaveBeenCalledWith(
    'session:user-123',
    900, // 15 minutes
    expect.any(String)
  );
});
```

---

## Troubleshooting

### Common Issues

1. **Tests timeout**
   - Increase Jest timeout: `jest.setTimeout(10000)`
   - Check for unresolved promises

2. **Type errors in mocks**
   - Use `as unknown as Type` for complex types
   - Simplify mock interfaces

3. **Tests fail in CI but pass locally**
   - Check environment variables
   - Verify service dependencies (Postgres, Redis)

4. **Coverage not reaching threshold**
   - Identify uncovered lines: `npm test -- --coverage --verbose`
   - Add tests for error paths and edge cases

### Getting Help

- Check Jest documentation: https://jestjs.io/
- React Testing Library: https://testing-library.com/react
- Project Discord/Slack for team support

---

## Next Steps

1. **Increase Coverage**
   - Add controller integration tests
   - Add WebSocket handler tests
   - Complete frontend component tests

2. **E2E Testing**
   - Set up Playwright or Cypress
   - Test complete user flows

3. **Performance Testing**
   - Load test API endpoints with 100+ concurrent requests
   - Test with 10,000+ shots in database

4. **Visual Regression Testing**
   - Use Percy or Chromatic for UI testing
   - Catch unintended visual changes

---

**Last Updated:** 2026-01-18
**Maintained By:** Development Team

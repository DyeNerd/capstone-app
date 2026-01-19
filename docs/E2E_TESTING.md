# E2E Testing Guide

Complete guide for end-to-end testing of the Badminton Training System.

## Overview

The E2E test suite validates the complete user journey from system startup through training session management to data visualization and cleanup. Built with **Playwright**, it provides comprehensive coverage of critical user flows.

## Quick Start

```bash
# 1. Install E2E dependencies
cd e2e
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Run all E2E tests
npm test

# 4. View test report
npm run report
```

## Test Architecture

### Technology Stack
- **Playwright** - Browser automation framework
- **TypeScript** - Type-safe test code
- **Docker Compose** - Isolated test environment
- **Python** - Mock CV component

### Project Structure
```
e2e/
├── playwright.config.ts          # Playwright configuration
├── docker-compose.test.yml        # Test Docker setup
├── helpers/                       # Test utilities
│   ├── auth.helper.ts             # Authentication
│   ├── docker.helper.ts           # Container management
│   ├── websocket.helper.ts        # WebSocket tracking
│   ├── cv-mock.helper.ts          # Mock CV execution
│   └── api.helper.ts              # API interactions
├── fixtures/                      # Test data
│   ├── users.fixture.ts
│   └── athletes.fixture.ts
├── tests/                         # Test specifications
│   ├── auth.e2e.spec.ts          # Authentication tests
│   └── training-session.e2e.spec.ts  # Training session tests
└── setup/                         # Global setup/teardown
    ├── global-setup.ts
    └── global-teardown.ts
```

## Test Suites

### 1. Authentication E2E (`auth.e2e.spec.ts`)

Tests user authentication flows:

- **User registration flow** - Complete signup process
- **Login with valid credentials** - Successful authentication
- **Login with invalid credentials** - Error handling
- **Logout flow** - Token clearing and redirect
- **Token persistence** - Survives page reload

**Run specific test:**
```bash
npm test auth.e2e.spec.ts
```

### 2. Training Session E2E (`training-session.e2e.spec.ts`)

Tests complete training session workflow:

1. User login
2. Navigate to training control
3. Select athlete
4. Start training session
5. Send 50 shots via mock CV (50ms intervals)
6. Verify real-time UI updates
7. Verify WebSocket events
8. Stop and save session
9. Verify persistence in database

**Run specific test:**
```bash
npm test training-session.e2e.spec.ts
```

**Test covers:**
- ✅ Session creation
- ✅ Real-time shot tracking (50 shots)
- ✅ WebSocket event verification
- ✅ Court visualization with colored markers
- ✅ Session statistics updates
- ✅ Session save with notes/rating
- ✅ Database persistence

## Running Tests

### Local Development

```bash
cd e2e

# Run all tests
npm test

# Run in headed mode (see browser)
npm run test:headed

# Run with UI mode (interactive)
npm run test:ui

# Run specific test file
npm test -- training-session.e2e.spec.ts

# Run in debug mode
npm run test:debug
```

### CI/CD (GitHub Actions)

The E2E tests are configured for **manual trigger only**.

**To run in GitHub Actions:**
1. Go to Actions tab in GitHub
2. Select "E2E Tests" workflow
3. Click "Run workflow"
4. View results and download artifacts

## Test Environment

### Docker Services

The E2E tests use isolated Docker containers:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5433 | Test database |
| Redis | 6380 | Session cache |
| RabbitMQ | 5673 | Message broker |
| RabbitMQ Management | 15673 | Admin UI |
| Backend API | 5001 | Express server |
| Frontend | 3001 | React app |

**Note:** Different ports prevent conflicts with development environment.

### Environment Variables

Configure in `e2e/.env.test`:

```env
API_URL=http://localhost:5001/api
SOCKET_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3001
DATABASE_URL=postgresql://badminton_user:badminton_pass@localhost:5433/badminton_training_test
RABBITMQ_URL=amqp://badminton:badminton123@localhost:5673
```

### Mock CV Component

The Python script simulates shot data:

```bash
# Send 10 shots with 3s interval (default)
python3 badminton-backend/scripts/mock_cv_component.py <session_id>

# Send 50 shots with 50ms interval (E2E test mode)
python3 badminton-backend/scripts/mock_cv_component.py <session_id> --count 50 --interval-ms 50

# Send 100 shots quickly
python3 badminton-backend/scripts/mock_cv_component.py <session_id> --count 100 --interval-ms 10
```

## Writing New Tests

### Test Template

```typescript
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';

test.describe('My Feature E2E', () => {
  let authHelper: AuthHelper;

  test.beforeAll(async () => {
    authHelper = new AuthHelper(process.env.API_URL!);
  });

  test('My test case', async ({ page }) => {
    await test.step('Step 1: Description', async () => {
      // Test code
      console.log('✓ Step 1 complete');
    });

    await test.step('Step 2: Description', async () => {
      // Test code
      console.log('✓ Step 2 complete');
    });
  });
});
```

### Best Practices

1. **Use test.step()** - Organize tests into clear steps
2. **Add console logs** - Track progress during execution
3. **Use fixtures** - Reuse test data from `fixtures/`
4. **Clean up** - Delete test data in `afterAll()`
5. **Wait appropriately** - Use `waitForTimeout()` for async operations
6. **Verify everything** - Check UI, API, WebSocket events

### Helper Usage

```typescript
// Authentication
const { token } = await authHelper.createTestUser(email, password);
await authHelper.loginViaBrowser(page, email, password);
await authHelper.setAuthToken(page, token);

// API calls
apiHelper.setAuthToken(token);
const athlete = await apiHelper.createAthlete(athleteData);
const session = await apiHelper.startSession(athleteId);

// WebSocket tracking
await wsHelper.setupSocketListener(page);
await wsHelper.waitForEvent(page, 'shot_received');
const events = await wsHelper.getSocketEvents(page);

// Mock CV
await cvMock.sendShots(sessionId, { count: 50, interval: 50 });
```

## Debugging Tests

### View Test in Browser

```bash
npm run test:headed
```

### Debug Mode

```bash
npm run test:debug
```

Opens Playwright Inspector with:
- Step-by-step execution
- Console logs
- Network requests
- Screenshots

### View Test Report

```bash
npm run report
```

Opens HTML report with:
- Test results
- Execution traces
- Screenshots on failure
- Video recordings (if test failed)

### Check Docker Logs

```bash
# Backend API logs
docker logs badminton_api_test

# RabbitMQ logs
docker logs badminton_rabbitmq_test

# PostgreSQL logs
docker logs badminton_postgres_test
```

### Manual Container Management

```bash
cd e2e

# Start containers manually
docker-compose -f docker-compose.test.yml up -d

# Check container status
docker-compose -f docker-compose.test.yml ps

# View logs
docker-compose -f docker-compose.test.yml logs -f api

# Stop and clean up
docker-compose -f docker-compose.test.yml down -v
```

## Troubleshooting

### Tests fail to start

**Problem:** Containers don't start
**Solution:**
```bash
cd e2e
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
# Wait 30 seconds, then retry tests
```

### Frontend doesn't load

**Problem:** `webServer` timeout
**Solution:**
```bash
# Check frontend dependencies
cd badminton-frontend
npm install

# Manually start frontend
PORT=3001 npm start
```

### Backend API health check fails

**Problem:** API container unhealthy
**Solution:**
```bash
# Check backend logs
docker logs badminton_api_test

# Verify database connection
docker exec -it badminton_postgres_test psql -U badminton_user -d badminton_training_test -c "SELECT 1"
```

### WebSocket events not captured

**Problem:** `window.socketEvents` is empty
**Solution:**
- Verify Socket.IO is loaded before test starts
- Check browser console for errors
- Increase wait time after `setupSocketListener()`

### Mock CV script fails

**Problem:** Python script error
**Solution:**
```bash
# Install pika library
pip3 install pika

# Test script manually
python3 badminton-backend/scripts/mock_cv_component.py test-session-id --count 5

# Check RabbitMQ connection
curl http://localhost:15673
```

### Port conflicts

**Problem:** "Port already in use"
**Solution:**
```bash
# Stop dev environment first
cd badminton-backend
docker-compose down

# Then run E2E tests
cd ../e2e
npm test
```

## Performance Expectations

| Metric | Expected Time |
|--------|--------------|
| Container startup | ~30 seconds |
| Frontend build | ~60 seconds |
| Auth E2E test | ~15 seconds |
| Training session E2E test | ~40 seconds |
| Total test suite | ~1 minute |
| CI/CD pipeline | ~5-7 minutes |

## Test Coverage

### Covered Scenarios

✅ User authentication (register, login, logout)
✅ Token persistence
✅ Athlete selection
✅ Training session lifecycle
✅ Real-time shot data (50 shots)
✅ WebSocket communication
✅ Court visualization
✅ Session statistics
✅ Session persistence

### Future Enhancements

- Athlete management (CRUD operations)
- Session history and filtering
- Error scenarios (network failures)
- Performance metrics
- Visual regression testing
- Cross-browser testing (Firefox, WebKit)
- Mobile responsive testing

## CI/CD Integration

### GitHub Actions Workflow

Location: `.github/workflows/e2e-tests.yml`

**Trigger:** Manual only (workflow_dispatch)

**Steps:**
1. Checkout code
2. Setup Node.js & Python
3. Install dependencies
4. Run E2E tests
5. Upload artifacts (reports, videos, logs)

**Artifacts:**
- `playwright-report` - HTML test report (30 days)
- `test-videos` - Video recordings of failures (7 days)
- `test-logs` - Application logs on failure (7 days)

### Running Workflow

1. Navigate to GitHub Actions tab
2. Select "E2E Tests" workflow
3. Click "Run workflow" button
4. Select branch (default: main)
5. Click "Run workflow"
6. Monitor execution
7. Download artifacts if needed

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Project README](../README.md)
- [Testing Guide](./TESTING_COMPLETE.md)
- [Demo Guide](./DEMO_GUIDE.md)
- [Mock CV Setup](./MOCK_CV_SETUP.md)

## Support

For issues or questions:
1. Check this documentation
2. Review test logs and screenshots
3. Check Docker container logs
4. Consult Playwright documentation
5. Open GitHub issue with test output

---

**Last Updated:** 2026-01-18
**Playwright Version:** 1.40.0
**Node Version:** 18.x

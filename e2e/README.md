# E2E Tests - Badminton Training System

End-to-end tests for the complete user journey using Playwright.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run all tests
npm test

# Run with UI (interactive mode)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# View test report
npm run report

# For debugging
cd /Users/vlumsirichar/uni/capstone/e2e
PWDEBUG=1 npx playwright test training-session --project=chromium

```

## What Gets Tested

### Authentication E2E
- User registration flow
- Login with valid/invalid credentials
- Logout and token clearing
- Token persistence across page reload

### Training Session E2E (Main Test)
1. ✅ User login
2. ✅ Navigate to training control
3. ✅ Select athlete
4. ✅ Start training session
5. ✅ Send 50 shots via mock CV (50ms intervals)
6. ✅ Verify real-time UI updates
7. ✅ Verify WebSocket events (50 shot_received events)
8. ✅ Verify court visualization with colored markers
9. ✅ Stop and save session with notes/rating
10. ✅ Verify session persisted in database

## Test Environment

**Docker containers (isolated from dev):**
- PostgreSQL: localhost:5433
- Redis: localhost:6380
- RabbitMQ: localhost:5673
- Backend API: localhost:5001
- Frontend: localhost:3001

**Automatic setup/teardown:**
- Global setup starts Docker containers before all tests
- Global teardown stops and removes containers after all tests
- Each test run starts with a fresh database

## Project Structure

```
e2e/
├── helpers/           # Reusable test utilities
├── fixtures/          # Test data (users, athletes)
├── tests/             # Test specifications
├── setup/             # Global setup/teardown
├── playwright.config.ts
└── docker-compose.test.yml
```

## Running Specific Tests

```bash
# Run only auth tests
npm test -- auth.e2e.spec.ts

# Run only training session tests
npm test -- training-session.e2e.spec.ts

# Debug specific test
npm run test:debug -- training-session.e2e.spec.ts
```

## Debugging

### View in Browser
```bash
npm run test:headed
```

### Debug Mode with Inspector
```bash
npm run test:debug
```

### View HTML Report
```bash
npm run report
```

### Check Docker Logs
```bash
docker logs badminton_api_test
docker logs badminton_rabbitmq_test
```

### Manual Docker Management
```bash
# Start containers
docker-compose -f docker-compose.test.yml up -d

# Check status
docker-compose -f docker-compose.test.yml ps

# Stop and clean up
docker-compose -f docker-compose.test.yml down -v
```

## Troubleshooting

**Containers won't start:**
```bash
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
# Wait 30 seconds, then retry
```

**Port conflicts:**
```bash
# Stop dev environment first
cd ../badminton-backend
docker-compose down
```

**Frontend build fails:**
```bash
cd ../badminton-frontend
npm install
```

**Mock CV script fails:**
```bash
pip3 install pika
```

## Performance Expectations

- Container startup: ~30 seconds
- Frontend build: ~60 seconds
- Auth tests: ~15 seconds
- Training session test: ~40 seconds (includes 50 shots)
- Total suite: ~1 minute

## Documentation

See [docs/E2E_TESTING.md](../docs/E2E_TESTING.md) for comprehensive guide.

## CI/CD

GitHub Actions workflow: `.github/workflows/e2e-tests.yml`
- **Trigger:** Manual only (workflow_dispatch)
- Navigate to Actions tab → "E2E Tests" → "Run workflow"

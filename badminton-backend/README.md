# Badminton Training System - Backend

Express.js + TypeScript backend API for the Badminton Training System with real-time shot data integration via RabbitMQ and WebSocket.

## Features

- 🔐 JWT Authentication with Redis session management
- 👥 Athlete Management (CRUD operations)
- 🏸 Training Session Control with real-time shot tracking
- 📊 Performance Analytics
- 🐰 RabbitMQ message broker integration for CV component
- 🔌 WebSocket (Socket.IO) for real-time updates
- 🐘 PostgreSQL database with TypeORM
- 🐳 Docker & Docker Compose for local development

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

## Quick Start

### 1. Clone and Setup

```bash
cd badminton-backend
cp .env.example .env
```

### 2. Start with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, RabbitMQ, API)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

The API will be available at `http://localhost:5000`

### 3. Local Development (without Docker)

```bash
# Install dependencies
npm install

# Make sure PostgreSQL, Redis, and RabbitMQ are running locally

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new coach
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Athletes
- `GET /api/athletes` - List all athletes
- `GET /api/athletes/:id` - Get athlete by ID
- `POST /api/athletes` - Create new athlete
- `PUT /api/athletes/:id` - Update athlete
- `DELETE /api/athletes/:id` - Delete athlete

### Training Sessions
- `POST /api/sessions/start` - Start training session (triggers CV component)
- `POST /api/sessions/:id/stop` - Stop training session
- `GET /api/sessions` - List sessions (with filters)
- `GET /api/sessions/:id` - Get session details with all shots

## WebSocket Events

Connect to `ws://localhost:5000`

**Client → Server:**
- `join_session` - Join session room to receive updates
- `leave_session` - Leave session room

**Server → Client:**
- `shot_received` - New shot data from CV component
- `session_stats_updated` - Session statistics updated
- `session_ended` - Session ended

## Message Broker (RabbitMQ)

### Published by Backend:
- `session.start` - Notify CV component to start tracking
- `session.stop` - Notify CV component to stop tracking

### Consumed by Backend:
- `shot.data.*` - Shot data from CV component

RabbitMQ Management UI: `http://localhost:15672` (user: `badminton`, password: `badminton123`)

## Database Schema

The database is automatically created and synchronized by TypeORM in development mode.

Main tables:
- `users` - Coach accounts
- `athletes` - Athletes being trained
- `training_sessions` - Training session records
- `shots` - Individual shot data
- `rallies` - Rally sequences
- `rally_events` - Rally event details

## Environment Variables

See `.env.example` for all available configuration options.

## Docker Services

- **postgres** - PostgreSQL database (port 5432)
- **redis** - Redis cache (port 6379)
- **rabbitmq** - RabbitMQ message broker (ports 5672, 15672)
- **api** - Express.js API (port 5000)

## Testing

```bash
# Run tests
npm test
```

## Development Notes

- TypeORM will automatically synchronize the database schema in development mode
- Hot reload is enabled in development mode with ts-node-dev
- All endpoints (except auth) require JWT authentication
- Session tokens are stored in Redis with 24-hour expiry

## Troubleshooting

### Database connection issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

### RabbitMQ not connecting
Check that RabbitMQ is healthy:
```bash
docker-compose ps
docker-compose logs rabbitmq
```

### Port conflicts
Change ports in `docker-compose.yml` if default ports are in use.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Enable HTTPS
4. Use production-grade PostgreSQL, Redis, and RabbitMQ instances
5. Set up proper logging and monitoring
6. Enable database backups

## License

MIT


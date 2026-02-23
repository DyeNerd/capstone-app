# Badminton Training System - Full Stack Application

A comprehensive badminton training system with real-time shot tracking, performance analytics, and court visualization.

## Project Structure

```
capstone/
├── badminton-backend/          # Express.js + TypeScript backend
├── badminton-frontend/         # React + TypeScript frontend
└── deprecated/                 # Old project files
```

## Backend (COMPLETED ✅)

### Stack
- Express.js 4.x + TypeScript
- PostgreSQL 14+ with TypeORM
- Redis for session management
- RabbitMQ for message broker
- Socket.IO for WebSocket
- Docker & Docker Compose

### Features Implemented
✅ JWT Authentication with Redis sessions
✅ User Management (Coaches)
✅ Athlete Management (CRUD)
✅ Training Session Control
✅ RabbitMQ integration for CV component communication
✅ WebSocket real-time shot data broadcasting
✅ Database models with TypeORM
✅ Complete API endpoints
✅ Docker Compose setup for local development

### Running the Backend

```bash
cd badminton-backend

# With Docker (recommended)
docker-compose up -d

# Without Docker
npm install
npm run dev

# API will be available at http://localhost:5000
```

### API Endpoints

**Auth:**
- POST `/api/auth/register` - Register coach
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user

**Athletes:**
- GET `/api/athletes` - List athletes
- GET `/api/athletes/:id` - Get athlete
- POST `/api/athletes` - Create athlete
- PUT `/api/athletes/:id` - Update athlete
- DELETE `/api/athletes/:id` - Delete athlete

**Sessions:**
- POST `/api/sessions/start` - Start training (triggers CV component)
- POST `/api/sessions/:id/stop` - Stop training
- GET `/api/sessions` - List sessions
- GET `/api/sessions/:id` - Get session with shots

## Frontend (COMPLETED ✅)

### Stack
- React 19 + TypeScript
- Material-UI v7
- React Router v7
- Chart.js + react-chartjs-2
- Socket.IO Client
- Context API for state management

### Features Implemented
✅ JWT Authentication (Login, Register, ProtectedRoute)
✅ Navigation with responsive layout
✅ Training Control with live court visualization
✅ SVG Court Visualization (full-court and half-court modes)
✅ Target Templates with cycling positions
✅ Performance Dashboard with session history
✅ Session Detail with shot-by-shot review
✅ Athlete Management (CRUD)
✅ Real-time WebSocket updates
✅ Memoized contexts and components (useCallback, useMemo)

### Running the Frontend

```bash
cd badminton-frontend
npm install
npm start
# App: http://localhost:3000
```

## Deployment

The application is deployed to the cloud using **Vercel** (frontend) and **Railway** (backend).

### Architecture

```
[Vercel CDN]                    [Railway]
  Static React SPA               Express.js + Socket.IO
       |                              |
       +--- HTTPS REST API ---------->+--- Railway PostgreSQL
       +--- WSS WebSocket ----------->+--- Railway Redis
                                      +--- CloudAMQP (optional)
```

- **Frontend:** Vercel — automatic builds from GitHub, CDN-hosted SPA with HTTPS
- **Backend:** Railway — Docker container with managed PostgreSQL and Redis
- **Message Broker:** CloudAMQP free tier (for CV component integration)

### Deploying Changes

1. Push to `main` branch on GitHub
2. Vercel auto-rebuilds the frontend
3. Railway auto-redeploys the backend

### Environment Variables

**Railway (backend):**
- `DATABASE_URL` — auto-linked from Railway PostgreSQL
- `REDIS_URL` — auto-linked from Railway Redis
- `NODE_ENV` — `production`
- `JWT_SECRET` — generated secret
- `FRONTEND_URL` — Vercel app URL
- `RABBITMQ_URL` — CloudAMQP URL (optional)

**Vercel (frontend, baked at build time):**
- `REACT_APP_API_URL` — Railway backend URL + `/api`
- `REACT_APP_SOCKET_URL` — Railway backend URL

## System Integration

### Message Flow

```
Frontend → Backend API → RabbitMQ → Computer Vision Component
                ↓
             WebSocket
                ↓
            Frontend (live updates)
```

### Training Session Flow

1. Coach logs in (Frontend)
2. Coach selects athlete
3. Coach starts training session (Frontend → Backend API)
4. Backend publishes `session.start` to RabbitMQ
5. CV Component receives signal and starts tracking
6. CV Component sends shot data to RabbitMQ (`shot.data.*`)
7. Backend receives shot data and:
   - Saves to PostgreSQL
   - Broadcasts to WebSocket
8. Frontend receives real-time shot data
9. Court visualization updates
10. Coach stops session
11. Backend publishes `session.stop`
12. Session saved with all shots

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://badminton_user:badminton_pass@localhost:5432/badminton_training
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://badminton:badminton123@localhost:5672
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Development Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+ (if not using Docker)
- Redis (if not using Docker)
- RabbitMQ (if not using Docker)

### Quick Start (Local Development)

1. **Start Backend:**
```bash
cd badminton-backend
docker-compose up -d
```

2. **Start Frontend:**
```bash
cd badminton-frontend
npm start
```

3. **Access Services:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- RabbitMQ Management: http://localhost:15672 (user: badminton, pass: badminton123)
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Database Schema

- **users** - Coach accounts
- **athletes** - Athletes being trained
- **training_sessions** - Training session records
- **shots** - Individual shot data with court coordinates
- **rallies** - Rally sequences
- **rally_events** - Detailed rally events

## Features

### Current Features
✅ User authentication (JWT with Redis sessions)
✅ Athlete management (CRUD)
✅ Training session control with target templates
✅ Real-time shot tracking via WebSocket
✅ SVG court visualization (full-court and half-court)
✅ Performance dashboard with session history
✅ Session detail with shot-by-shot review
✅ Message broker integration (RabbitMQ/CloudAMQP)
✅ Database persistence (PostgreSQL)
✅ Docker development environment
✅ Cloud deployment (Vercel + Railway)

### Planned Features
- [ ] Chart.js visualizations (accuracy trends, shot counts)
- [ ] Shot heatmap overlay on court
- [ ] Session replay (animate shots in sequence)
- [ ] Export reports (PDF/CSV)
- [ ] Rally analysis
- [ ] Multi-court support

## Testing

### Backend
```bash
cd badminton-backend
npm test
```

### Frontend
```bash
cd badminton-frontend
npm test
```

## Architecture Diagrams

See `deprecated/` folder for original architecture diagrams and database schema documentation.

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT

---

## Implementation Status

**Backend:** 100% Complete ✅ (deployed on Railway)
**Frontend:** 100% Complete ✅ (deployed on Vercel)
**Deployment:** Production ✅ (Vercel + Railway + CloudAMQP)


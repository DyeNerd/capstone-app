# 🏸 Badminton Training System - Getting Started Guide

## Project Overview

A comprehensive full-stack badminton training system with:
- **Real-time shot tracking** via computer vision integration
- **Live court visualization** with SVG rendering
- **Performance analytics** and session management
- **WebSocket communication** for real-time updates
- **Message broker (RabbitMQ)** for CV component integration

## Quick Start (5 Minutes)

### 1. Start the Backend

```bash
cd badminton-backend
npm install
docker-compose up -d
```

This will start:
- ✅ PostgreSQL database (port 5432)
- ✅ Redis cache (port 6379)
- ✅ RabbitMQ broker (ports 5672, 15672)
- ✅ Express.js API (port 5000)

**Verify backend is running:**
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","message":"Badminton Training API is running"}
```

### 2. Start the Frontend

```bash
cd badminton-frontend
npm start
```

The app will open at `http://localhost:3000`

### 3. Create Your First Account

1. Click "Register here" on the login page
2. Fill in your details (coach account)
3. You'll be automatically logged in

### 4. Start Training!

1. Go to "Athletes" and create your first athlete
2. Return to "Training" page
3. Select the athlete from dropdown
4. Click "START TRAINING"
5. Watch the live court visualization!

## Architecture

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│   Frontend      │◄─────►│    Backend      │◄─────►│   PostgreSQL     │
│  React + MUI    │       │  Express.js API │       │   Database       │
│  (Port 3000)    │       │  (Port 5000)    │       │   (Port 5432)    │
└─────────────────┘       └─────────────────┘       └──────────────────┘
         │                         │
         │                         │
         │ WebSocket               │ Message Broker
         │ (Socket.IO)             │ (RabbitMQ)
         │                         │
         └────────┬────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Computer Vision │
         │   Component      │
         │  (External)      │
         └─────────────────┘
```

## System Flow

### Training Session Flow

1. **Coach logs in** → Frontend authenticates with backend
2. **Coach selects athlete** → Frontend loads athlete data
3. **Coach starts training** → Backend API call triggers:
   - Create session in database
   - Publish `session.start` to RabbitMQ
   - CV component receives signal and starts tracking
4. **CV detects shot** → CV publishes shot data to RabbitMQ:
   ```json
   {
     "sessionId": "uuid",
     "shotNumber": 1,
     "targetPosition": {"x": 10.2, "y": 3.1},
     "landingPosition": {"x": 10.5, "y": 3.2},
     "velocity": 45.5
   }
   ```
5. **Backend receives shot** → Backend:
   - Calculates accuracy
   - Saves to database
   - Broadcasts via WebSocket to frontend
6. **Frontend updates** → Court visualization shows shot in real-time
7. **Coach stops training** → Backend:
   - Publishes `session.stop` to RabbitMQ
   - Calculates final statistics
   - Saves session

## Features Implemented

### ✅ Backend (100% Complete)
- [x] JWT authentication with Redis sessions
- [x] User/Coach management
- [x] Athlete CRUD operations
- [x] Training session control
- [x] Shot data management
- [x] RabbitMQ message broker integration
- [x] WebSocket (Socket.IO) for real-time updates
- [x] PostgreSQL database with TypeORM
- [x] Docker Compose setup

### ✅ Frontend (100% Complete)
- [x] User authentication (Login/Register)
- [x] Protected routes
- [x] Training control interface
- [x] **Real-time court visualization** (SVG)
- [x] Athlete management (CRUD)
- [x] Performance dashboard
- [x] Session detail view with all shots
- [x] WebSocket integration
- [x] Material-UI design

## Testing the System

### Test Backend API

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@example.com",
    "username": "testcoach",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@example.com",
    "password": "password123"
  }'
# Save the token from response

# Get athletes (use token from login)
curl http://localhost:5000/api/athletes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test RabbitMQ

Access RabbitMQ Management UI:
- URL: http://localhost:15672
- Username: `badminton`
- Password: `badminton123`

You can see:
- Exchanges
- Queues
- Message flow
- Published/consumed messages

### Test WebSocket

Open browser console on frontend (F12) when a training session is active:
```javascript
// You'll see logs like:
// Shot received: {shotNumber: 1, accuracy: 25.3, ...}
// Session stats updated: {...}
```

## Mock CV Component (For Testing)

Since the actual CV component is separate, you can simulate shot data:

### Option 1: Use Backend Mock Service (Already Implemented)

The backend has a mock CV service that can generate test shot data. You can trigger it through the API or modify `broker.service.ts` to auto-generate shots during active sessions.

### Option 2: Publish to RabbitMQ Directly

```javascript
// Use RabbitMQ Management UI "Publish message" feature
// Exchange: badminton_training
// Routing key: shot.data.test
// Payload:
{
  "sessionId": "your-session-id",
  "shotNumber": 1,
  "timestamp": "2025-10-29T12:00:00Z",
  "targetPosition": {"x": 10.0, "y": 3.0},
  "landingPosition": {"x": 10.2, "y": 3.1},
  "velocity": 45.0,
  "detectionConfidence": 0.95
}
```

## Database Access

### PostgreSQL
```bash
# Connect to database
docker exec -it badminton_postgres psql -U badminton_user -d badminton_training

# View tables
\dt

# View users
SELECT * FROM users;

# View sessions
SELECT * FROM training_sessions;

# View shots
SELECT * FROM shots;
```

### Redis
```bash
# Connect to Redis
docker exec -it badminton_redis redis-cli

# View all keys
KEYS *

# Get session data
GET session:USER_ID
```

## Troubleshooting

### Backend won't start
```bash
# Check if ports are in use
lsof -i :5000  # API
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :5672  # RabbitMQ

# Restart services
cd badminton-backend
docker-compose down
docker-compose up -d
```

### Frontend won't connect to backend
1. Check `.env` file in `badminton-frontend/`:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```
2. Verify backend is running: `curl http://localhost:5000/health`
3. Check browser console for CORS errors
4. Restart frontend: `npm start`

### Database issues
```bash
# Reset database (WARNING: deletes all data)
cd badminton-backend
docker-compose down -v
docker-compose up -d
```

### WebSocket not connecting
1. Check Socket.IO connection in browser console
2. Verify REACT_APP_SOCKET_URL in .env
3. Check backend logs: `docker-compose logs -f api`
4. Ensure CORS is configured correctly in backend

## Development Workflow

### Adding a New Feature

1. **Backend Changes:**
   ```bash
   cd badminton-backend/src
   # Add/modify models, services, controllers
   # Backend auto-reloads with ts-node-dev
   ```

2. **Frontend Changes:**
   ```bash
   cd badminton-frontend/src
   # Add/modify components
   # Frontend auto-reloads with React hot reload
   ```

3. **Database Changes:**
   - Modify entities in `badminton-backend/src/models/`
   - TypeORM will auto-sync in development
   - For production, create migrations:
     ```bash
     npm run migration:generate -- -n MigrationName
     npm run migration:run
     ```

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

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use production database, Redis, RabbitMQ
3. Set strong JWT_SECRET
4. Enable HTTPS
5. Set up logging and monitoring
6. Use PM2 or Docker for process management

### Frontend
1. Build: `npm run build`
2. Deploy `build/` folder to:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Nginx static hosting
3. Update REACT_APP_API_URL to production API URL

## Next Steps

### Immediate Enhancements
- [ ] Add chart visualizations (Chart.js already installed)
- [ ] Implement shot heatmap on court
- [ ] Add session replay feature
- [ ] Export reports to PDF/CSV
- [ ] Add more detailed analytics

### Advanced Features
- [ ] Mobile app (React Native)
- [ ] Multi-court support
- [ ] Video recording integration
- [ ] Machine learning predictions
- [ ] Tournament mode
- [ ] Social features (athlete comparisons)

## Support

For issues or questions:
1. Check this guide
2. Review README files in backend/frontend folders
3. Check browser console and backend logs
4. Inspect RabbitMQ management UI

## Tech Stack Summary

**Backend:**
- Express.js 4.x + TypeScript
- PostgreSQL 14 + TypeORM
- Redis 7
- RabbitMQ 3
- Socket.IO 4
- Docker & Docker Compose

**Frontend:**
- React 19 + TypeScript
- Material-UI 7
- React Router 7
- Socket.IO Client
- Chart.js

**Key Patterns:**
- RESTful API design
- WebSocket for real-time updates
- Message broker for service communication
- JWT authentication
- Context API for state management
- SVG for court visualization

---

## 🎉 You're Ready!

Start the backend, start the frontend, and begin tracking badminton training sessions with real-time shot visualization!

**Happy Coding! 🏸**

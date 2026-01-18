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

## Frontend (IN PROGRESS ⚠️)

### Stack
- React 19 + TypeScript
- Material-UI v7
- React Router v7
- Chart.js + react-chartjs-2
- Socket.IO Client
- Context API for state management

### Completed Components
✅ Project structure created
✅ Dependencies installed
✅ TypeScript types defined
✅ API utility functions
✅ AuthContext (authentication management)
✅ TrainingContext (training state + WebSocket)

### Components Needed (TO DO)

**Authentication Components:**
- [ ] Login.tsx
- [ ] Register.tsx
- [ ] ProtectedRoute.tsx

**Main Components:**
- [ ] Navigation.tsx
- [ ] TrainingControl.tsx (with live court visualization)
- [ ] CourtVisualization.tsx (SVG badminton court)
- [ ] PerformanceDashboard.tsx
- [ ] SessionDetail.tsx (detailed session view)
- [ ] AthleteManagement.tsx

**App Setup:**
- [ ] App.tsx (routing + theme)
- [ ] index.tsx (providers)

### Running the Frontend

```bash
cd badminton-frontend

# Install dependencies (already done)
npm install

# Start development server
npm start

# App will be available at http://localhost:3000
```

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

### Quick Start

1. **Start Backend:**
```bash
cd badminton-backend
docker-compose up -d
```

2. **Start Frontend (once components are complete):**
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

## Next Steps

### To Complete Frontend:

1. **Create Authentication Pages:**
   - Implement Login component with form validation
   - Implement Register component with password strength indicator
   - Create ProtectedRoute wrapper

2. **Create Main App:**
   - Set up App.tsx with routing and MUI theme
   - Configure React Router
   - Wrap with AuthProvider and TrainingProvider

3. **Create Training Components:**
   - TrainingControl with athlete selection and session controls
   - CourtVisualization (SVG) showing real-time shot data
   - WebSocket integration for live updates

4. **Create Performance Components:**
   - PerformanceDashboard with charts and statistics
   - SessionDetail page showing all shots on court
   - Training history table

5. **Create Athlete Management:**
   - Athlete list/grid view
   - Create/Edit athlete form dialog
   - Delete confirmation

6. **Create Navigation:**
   - AppBar with navigation links
   - User menu with logout
   - Responsive mobile menu

## Features

### Current Features
✅ User authentication (JWT)
✅ Athlete management
✅ Training session control
✅ Real-time shot data via WebSocket
✅ Message broker integration
✅ Database persistence
✅ Docker development environment

### Planned Features
- [ ] Court visualization with shot heatmaps
- [ ] Performance analytics with charts
- [ ] Session replay and analysis
- [ ] Advanced statistics
- [ ] Export reports (PDF/CSV)
- [ ] Mobile responsive design
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

**Backend:** 100% Complete ✅
**Frontend:** 40% Complete ⚠️

### Time Estimate for Remaining Frontend Work:
- Authentication components: 2-3 hours
- Training control + court viz: 4-5 hours
- Performance dashboard: 3-4 hours
- Athlete management: 2-3 hours
- Navigation + App setup: 1-2 hours
**Total:** 12-17 hours of development time

The foundational work is complete. The remaining work is primarily UI components following the established patterns.


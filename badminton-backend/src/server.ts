import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { brokerService } from './services/broker.service';
import { socketHandler } from './websocket/socket.handler';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = createServer(app);

// Initialize services
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Initialize Redis
    await initializeRedis();

    // Initialize WebSocket
    socketHandler.initialize(server);

    // Initialize RabbitMQ broker
    await brokerService.initialize();

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API available at http://localhost:${PORT}`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Start the server
startServer();


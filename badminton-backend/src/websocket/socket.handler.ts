import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

class SocketHandler {
  private io: Server | null = null;

  initialize(server: HTTPServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`[SOCKET] Client connected: ${socket.id}`);

      socket.on('join_session', (sessionId: string) => {
        socket.join(`session_${sessionId}`);
        console.log(`[SOCKET] Client ${socket.id} joined session ${sessionId}`);
      });

      socket.on('leave_session', (sessionId: string) => {
        socket.leave(`session_${sessionId}`);
        console.log(`[SOCKET] Client ${socket.id} left session ${sessionId}`);
      });

      socket.on('disconnect', () => {
        console.log(`[SOCKET] Client disconnected: ${socket.id}`);
      });
    });

    console.log('✅ WebSocket initialized');
  }

  emitShotData(sessionId: string, shotData: any) {
    if (!this.io) return;
    this.io.to(`session_${sessionId}`).emit('shot_received', shotData);
  }

  emitSessionStats(sessionId: string, stats: any) {
    if (!this.io) return;
    this.io.to(`session_${sessionId}`).emit('session_stats_updated', stats);
  }

  emitSessionEnded(sessionId: string) {
    if (!this.io) return;
    this.io.to(`session_${sessionId}`).emit('session_ended');
  }
}

export const socketHandler = new SocketHandler();


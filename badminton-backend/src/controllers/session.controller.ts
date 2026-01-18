import { Response } from 'express';
import { sessionService } from '../services/session.service';
import { brokerService } from '../services/broker.service';
import { socketHandler } from '../websocket/socket.handler';
import { AuthRequest } from '../types';

export class SessionController {
  async startSession(req: AuthRequest, res: Response) {
    try {
      const { athleteId, targetZone } = req.body;
      const coachId = req.user!.id;

      if (!athleteId) {
        return res.status(400).json({ error: 'athleteId is required' });
      }

      const session = await sessionService.createSession({
        athleteId,
        coachId,
        startTime: new Date(),
        status: 'active',
        targetZone,
      });

      // Send signal to CV component via broker
      await brokerService.publishSessionStart({
        sessionId: session.id,
        athleteId,
        targetZone,
        timestamp: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        session,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async stopSession(req: AuthRequest, res: Response) {
    try {
      const { sessionId } = req.params;
      const { sessionNotes, sessionRating } = req.body;

      const session = await sessionService.stopSession(sessionId, {
        endTime: new Date(),
        status: 'completed',
        sessionNotes,
        sessionRating,
      });

      // Send stop signal to CV component
      await brokerService.publishSessionStop({
        sessionId,
        timestamp: new Date().toISOString(),
      });

      // Close WebSocket room
      socketHandler.emitSessionEnded(sessionId);

      // Get final statistics
      const sessionWithStats = await sessionService.getSessionById(sessionId, ['shots']);

      res.status(200).json({
        success: true,
        session: sessionWithStats,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSession(req: AuthRequest, res: Response) {
    try {
      const { sessionId } = req.params;

      const session = await sessionService.getSessionById(sessionId, ['athlete', 'coach', 'shots']);

      res.status(200).json({ success: true, session });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async listSessions(req: AuthRequest, res: Response) {
    try {
      const sessions = await sessionService.listSessions(req.query);

      res.status(200).json({ success: true, ...sessions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const sessionController = new SessionController();


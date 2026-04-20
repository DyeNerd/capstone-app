import { Response } from 'express';
import { sessionService } from '../services/session.service';
import { brokerService } from '../services/broker.service';
import { socketHandler } from '../websocket/socket.handler';
import { templateService } from '../services/template.service';
import { AuthRequest } from '../types';

export class SessionController {
  async startSession(req: AuthRequest, res: Response) {
    try {
      const { athleteId, targetZone, templateId } = req.body;
      const coachId = req.user!.id;

      if (!athleteId) {
        return res.status(400).json({ error: 'athleteId is required' });
      }

      if (!templateId) {
        return res.status(400).json({ error: 'templateId is required' });
      }

      // Validate template exists
      const template = templateService.getTemplateById(templateId);
      if (!template) {
        return res.status(400).json({ error: 'Invalid templateId - template not found' });
      }

      const session = await sessionService.createSession({
        athleteId,
        coachId,
        startTime: new Date(),
        status: 'active',
        targetZone,
        templateId,
      });

      // Send signal to CV component via broker
      await brokerService.publishSessionStart({
        sessionId: session.id,
        timestamp: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        session,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }

  async stopSession(req: AuthRequest, res: Response) {
    try {
      const { sessionId } = req.params;
      const { sessionNotes, sessionRating } = req.body;

      // Check current status before stopping
      const existing = await sessionService.getSessionById(sessionId);
      const wasActive = existing.status === 'active';

      await sessionService.stopSession(sessionId, {
        endTime: wasActive ? new Date() : (existing.end_time ?? new Date()),
        status: 'completed',
        sessionNotes,
        sessionRating,
      });

      // Only send stop signal and close WebSocket if session was active
      if (wasActive) {
        await brokerService.publishSessionStop({
          sessionId,
          timestamp: new Date().toISOString(),
        });

        socketHandler.emitSessionEnded(sessionId);
      }

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

  async deleteSession(req: AuthRequest, res: Response) {
    try {
      const { sessionId } = req.params;

      await sessionService.deleteSession(sessionId);

      res.status(200).json({
        success: true,
        message: 'Session deleted successfully',
      });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}

export const sessionController = new SessionController();


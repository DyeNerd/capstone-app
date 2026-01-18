import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { redisClient } from '../config/redis';
import { AuthRequest } from '../types';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, username, password } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await authService.register(email, username, password);

      // Store session in Redis (24 hours)
      await redisClient.setEx(`session:${result.user.id}`, 86400, result.token);

      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await authService.login(email, password);

      // Store session in Redis (24 hours)
      await redisClient.setEx(`session:${result.user.id}`, 86400, result.token);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      if (req.user) {
        // Remove session from Redis
        await redisClient.del(`session:${req.user.id}`);
      }

      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await authService.getUserById(req.user.id);

      res.status(200).json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();


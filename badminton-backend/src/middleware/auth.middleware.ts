import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';
import { redisClient } from '../config/redis';
import { AuthRequest } from '../types';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = verifyToken(token);

    // Check if session exists in Redis
    const session = await redisClient.get(`session:${decoded.id}`);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};


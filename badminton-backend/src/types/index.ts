import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export interface ShotDataFromCV {
  sessionId: string;
  shotNumber: number;
  timestamp: string;
  targetPosition: { x: number; y: number };
  landingPosition: { x: number; y: number };
  velocity?: number;
  detectionConfidence?: number;
}

export interface SessionStartEvent {
  sessionId: string;
  athleteId: string;
  targetZone?: string;
  timestamp: string;
}

export interface SessionStopEvent {
  sessionId: string;
  timestamp: string;
}

export type SessionStatus = 'active' | 'completed' | 'cancelled' | 'paused';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';
export type DominantHand = 'left' | 'right';
export type CourtZone = 'front_left' | 'front_right' | 'back_left' | 'back_right' | 'unknown';


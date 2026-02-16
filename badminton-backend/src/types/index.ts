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
  landingPosition: { x: number; y: number }; // In cm (half-court: 0-610 x 0-670)
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

// Target Templates Types (Half-court coordinates in cm: 610 wide × 670 deep)
export interface TargetPosition {
  positionIndex: number;
  box: { x1: number; y1: number; x2: number; y2: number }; // Target box bounds in cm
  dot: { x: number; y: number }; // Ideal landing point in cm
  label?: string;
}

export interface TargetTemplate {
  id: string;
  name: string;
  description?: string;
  positions: TargetPosition[];
}


import { CourtZone } from '../types';

// Standard badminton court dimensions
const COURT_LENGTH = 13.4; // meters
const COURT_WIDTH = 6.1; // meters

export const calculateAccuracy = (
  target: { x: number; y: number },
  landing: { x: number; y: number }
): number => {
  const dx = landing.x - target.x;
  const dy = landing.y - target.y;
  return Math.sqrt(dx * dx + dy * dy) * 100; // convert to cm
};

export const determineCourtZone = (position: { x: number; y: number }): CourtZone => {
  const { x, y } = position;

  // Check if position is within court bounds
  if (x < 0 || x > COURT_LENGTH || y < 0 || y > COURT_WIDTH) {
    return 'unknown';
  }

  const isFront = x < COURT_LENGTH / 2;
  const isLeft = y < COURT_WIDTH / 2;

  if (isFront && isLeft) return 'front_left';
  if (isFront && !isLeft) return 'front_right';
  if (!isFront && isLeft) return 'back_left';
  if (!isFront && !isLeft) return 'back_right';

  return 'unknown';
};

export const calculateAccuracyPercent = (accuracyCm: number): number => {
  // Accuracy percent decreases as distance from target increases
  // 0cm = 100%, 50cm = 50%, 100cm+ = 0%
  return Math.max(0, 100 - (accuracyCm / 2));
};


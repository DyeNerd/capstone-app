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

  // Check if position is within court bounds (y is 0 to -670 in cm, converted to meters)
  const absY = Math.abs(y);
  if (x < 0 || x > COURT_LENGTH || absY > COURT_WIDTH) {
    return 'unknown';
  }

  const isFront = x < COURT_LENGTH / 2;
  const isLeft = absY < COURT_WIDTH / 2;

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

/**
 * Check if a point is inside a rectangular box
 * All coordinates in cm (half-court: 610 wide × 670 deep, y: 0 to -670)
 */
export const isPointInBox = (
  point: { x: number; y: number },
  box: { x1: number; y1: number; x2: number; y2: number }
): boolean => {
  const minX = Math.min(box.x1, box.x2);
  const maxX = Math.max(box.x1, box.x2);
  const minY = Math.min(box.y1, box.y2);
  const maxY = Math.max(box.y1, box.y2);

  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
};

/**
 * Calculate shot score (0–100)
 * 100 = perfect landing at target center (0cm)
 * Scores decrease with distance: score = max(0, 100 - accuracyCm)
 * In-box shots are guaranteed a minimum of 75
 */
export const calculateScore = (accuracyCm: number, inBox: boolean | null | undefined): number => {
  const rawScore = Math.max(0, 100 - accuracyCm);
  return inBox === true ? Math.max(75, rawScore) : rawScore;
};


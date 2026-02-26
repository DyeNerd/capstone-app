import { TargetTemplate } from '../types';

/**
 * Preset target templates for training sessions.
 * Coordinates use half-court system: 610cm wide × 670cm deep
 * Origin (0,0) at net, (610, -670) at baseline corner
 * Y-axis: 0 at net, -670 at baseline (negative values moving away from net)
 */
export const PRESET_TEMPLATES: TargetTemplate[] = [
  {
    id: 'template-001',
    name: 'template-001',
    description: 'first template',
    positions: [
      {
        positionIndex: 0,
        box: { x1: 46, y1: -594, x2: 122, y2: -670 },
        dot: { x: 46, y: -670 },
      },
      {
        positionIndex: 1,
        box: { x1: 488, y1: -198, x2: 564, y2: -274 },
        dot: { x: 526, y: -236 },
      },
      {
        positionIndex: 2,
        box: { x1: 488, y1: 0, x2: 564, y2: -76 },
        dot: { x: 526, y: -38 },
      },
    ],
  },
];

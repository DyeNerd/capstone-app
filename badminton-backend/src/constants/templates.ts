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
        dot: { x: 564, y: -236 },
      },
      {
        positionIndex: 2,
        box: { x1: 488, y1: 0, x2: 564, y2: -76 },
        dot: { x: 564, y: 0 },
      },
    ],
  },
  {
    id: 'template-002',
    name: 'template-002',
    description: 'second template',
    positions: [
      {
        positionIndex: 0,
        box: { x1: 488, y1: -594, x2: 564, y2: -670 },
        dot: { x: 564, y: -670 },
      },
      {
        positionIndex: 1,
        box: { x1: 46, y1: -243, x2: 66, y2: -400 },
        dot: { x: 46, y: -321 },
      },
      {
        positionIndex: 2,
        box: { x1: 46, y1: 0, x2: 122, y2: -76 },
        dot: { x: 46, y: 0 },
      },
    ],
  },
  {
    id: 'template-003',
    name: 'template-003',
    description: 'third template',
    positions: [
      {
        positionIndex: 0,
        box: { x1: 46, y1: -594, x2: 122, y2: -670 },
        dot: { x: 46, y: -670 },
      },
      {
        positionIndex: 1,
        box: { x1: 46, y1: 0, x2: 122, y2: -76 },
        dot: { x: 46, y: 0 },
      },
      {
        positionIndex: 2,
        box: { x1: 544, y1: -117, x2: 564, y2: -274 },
        dot: { x: 564, y: -175 },
      },
      {
        positionIndex: 3,
        box: { x1: 488, y1: 0, x2: 564, y2: -76 },
        dot: { x: 564, y: 0 },
      },
    ],
  },
  {
    id: 'template-004',
    name: 'template-004',
    description: 'fourth template - 6 boxes covering the whole court (3 rows × 2 columns)',
    positions: [
      {
        positionIndex: 0,
        box: { x1: 0, y1: 0, x2: 305, y2: -223 },
        dot: { x: 46, y: 0 },
      },
      {
        positionIndex: 1,
        box: { x1: 305, y1: 0, x2: 610, y2: -223 },
        dot: { x: 564, y: 0 },
      },
      {
        positionIndex: 2,
        box: { x1: 0, y1: -223, x2: 305, y2: -447 },
        dot: { x: 46, y: -335 },
      },
      {
        positionIndex: 3,
        box: { x1: 305, y1: -223, x2: 610, y2: -447 },
        dot: { x: 564, y: -335 },
      },
      {
        positionIndex: 4,
        box: { x1: 0, y1: -447, x2: 305, y2: -670 },
        dot: { x: 46, y: -670 },
      },
      {
        positionIndex: 5,
        box: { x1: 305, y1: -447, x2: 610, y2: -670 },
        dot: { x: 564, y: -670 },
      },
    ],
  },
];

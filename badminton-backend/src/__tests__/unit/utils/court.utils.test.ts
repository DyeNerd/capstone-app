import {
  calculateAccuracy,
  determineCourtZone,
  calculateAccuracyPercent,
  isPointInBox,
  calculateScore,
} from '../../../utils/court.utils';

describe('Court Utilities', () => {
  describe('isPointInBox', () => {
    const standardBox = { x1: 100, y1: 100, x2: 200, y2: 200 };

    describe('points inside box', () => {
      it('should return true for point at center of box', () => {
        const point = { x: 150, y: 150 };
        expect(isPointInBox(point, standardBox)).toBe(true);
      });

      it('should return true for point at top-left corner', () => {
        const point = { x: 100, y: 100 };
        expect(isPointInBox(point, standardBox)).toBe(true);
      });

      it('should return true for point at top-right corner', () => {
        const point = { x: 200, y: 100 };
        expect(isPointInBox(point, standardBox)).toBe(true);
      });

      it('should return true for point at bottom-left corner', () => {
        const point = { x: 100, y: 200 };
        expect(isPointInBox(point, standardBox)).toBe(true);
      });

      it('should return true for point at bottom-right corner', () => {
        const point = { x: 200, y: 200 };
        expect(isPointInBox(point, standardBox)).toBe(true);
      });

      it('should return true for point on left edge', () => {
        const point = { x: 100, y: 150 };
        expect(isPointInBox(point, standardBox)).toBe(true);
      });

      it('should return true for point on right edge', () => {
        const point = { x: 200, y: 150 };
        expect(isPointInBox(point, standardBox)).toBe(true);
      });

      it('should return true for point on top edge', () => {
        const point = { x: 150, y: 100 };
        expect(isPointInBox(point, standardBox)).toBe(true);
      });

      it('should return true for point on bottom edge', () => {
        const point = { x: 150, y: 200 };
        expect(isPointInBox(point, standardBox)).toBe(true);
      });
    });

    describe('points outside box', () => {
      it('should return false for point above box', () => {
        const point = { x: 150, y: 50 };
        expect(isPointInBox(point, standardBox)).toBe(false);
      });

      it('should return false for point below box', () => {
        const point = { x: 150, y: 250 };
        expect(isPointInBox(point, standardBox)).toBe(false);
      });

      it('should return false for point left of box', () => {
        const point = { x: 50, y: 150 };
        expect(isPointInBox(point, standardBox)).toBe(false);
      });

      it('should return false for point right of box', () => {
        const point = { x: 250, y: 150 };
        expect(isPointInBox(point, standardBox)).toBe(false);
      });

      it('should return false for point at top-left outside', () => {
        const point = { x: 99, y: 99 };
        expect(isPointInBox(point, standardBox)).toBe(false);
      });

      it('should return false for point just outside right edge', () => {
        const point = { x: 201, y: 150 };
        expect(isPointInBox(point, standardBox)).toBe(false);
      });
    });

    describe('inverted box coordinates', () => {
      // Box with x1 > x2 and y1 > y2 (should still work)
      const invertedBox = { x1: 200, y1: 200, x2: 100, y2: 100 };

      it('should handle box with inverted x coordinates', () => {
        const point = { x: 150, y: 150 };
        expect(isPointInBox(point, invertedBox)).toBe(true);
      });

      it('should return false for point outside inverted box', () => {
        const point = { x: 50, y: 50 };
        expect(isPointInBox(point, invertedBox)).toBe(false);
      });
    });

    describe('template-001 positions', () => {
      // Position 0 box from template-001
      const position0Box = { x1: 46, y1: -594, x2: 122, y2: -670 };

      it('should return true for dot inside position 0 box', () => {
        const dot = { x: 46, y: -670 }; // Position 0 dot
        expect(isPointInBox(dot, position0Box)).toBe(true);
      });

      it('should return true for point at center of position 0 box', () => {
        const center = { x: 84, y: -632 };
        expect(isPointInBox(center, position0Box)).toBe(true);
      });

      it('should return false for point outside position 0 box', () => {
        const outside = { x: 200, y: 200 };
        expect(isPointInBox(outside, position0Box)).toBe(false);
      });

      // Position 1 box from template-001
      const position1Box = { x1: 488, y1: -198, x2: 564, y2: -274 };

      it('should return true for dot inside position 1 box', () => {
        const dot = { x: 526, y: -236 }; // Position 1 dot
        expect(isPointInBox(dot, position1Box)).toBe(true);
      });

      // Position 2 box from template-001
      const position2Box = { x1: 488, y1: 0, x2: 564, y2: -76 };

      it('should return true for dot inside position 2 box', () => {
        const dot = { x: 526, y: -38 }; // Position 2 dot
        expect(isPointInBox(dot, position2Box)).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle zero-size box (point)', () => {
        const pointBox = { x1: 100, y1: 100, x2: 100, y2: 100 };
        const point = { x: 100, y: 100 };
        expect(isPointInBox(point, pointBox)).toBe(true);
      });

      it('should return false for different point on zero-size box', () => {
        const pointBox = { x1: 100, y1: 100, x2: 100, y2: 100 };
        const point = { x: 101, y: 100 };
        expect(isPointInBox(point, pointBox)).toBe(false);
      });

      it('should handle box at origin', () => {
        const originBox = { x1: 0, y1: 0, x2: 50, y2: 50 };
        const point = { x: 25, y: 25 };
        expect(isPointInBox(point, originBox)).toBe(true);
      });

      it('should handle negative coordinates', () => {
        const negativeBox = { x1: -100, y1: -100, x2: -50, y2: -50 };
        const point = { x: -75, y: -75 };
        expect(isPointInBox(point, negativeBox)).toBe(true);
      });
    });
  });

  describe('calculateAccuracy', () => {
    it('should return 0 for identical positions', () => {
      const target = { x: 5, y: 5 };
      const landing = { x: 5, y: 5 };
      expect(calculateAccuracy(target, landing)).toBe(0);
    });

    it('should return correct distance in cm for horizontal offset', () => {
      const target = { x: 5, y: 5 };
      const landing = { x: 5.1, y: 5 }; // 0.1m = 10cm offset
      expect(calculateAccuracy(target, landing)).toBeCloseTo(10, 5);
    });

    it('should return correct distance in cm for vertical offset', () => {
      const target = { x: 5, y: 5 };
      const landing = { x: 5, y: 5.2 }; // 0.2m = 20cm offset
      expect(calculateAccuracy(target, landing)).toBeCloseTo(20, 5);
    });

    it('should return correct distance for diagonal offset', () => {
      const target = { x: 0, y: 0 };
      const landing = { x: 0.3, y: 0.4 }; // 3-4-5 triangle = 50cm
      expect(calculateAccuracy(target, landing)).toBe(50);
    });
  });

  describe('determineCourtZone', () => {
    // Court dimensions: 13.4m x 6.1m
    // Front: x < 6.7, Back: x >= 6.7
    // Left: y < 3.05, Right: y >= 3.05

    it('should return front_left for front-left position', () => {
      const position = { x: 3, y: 1 };
      expect(determineCourtZone(position)).toBe('front_left');
    });

    it('should return front_right for front-right position', () => {
      const position = { x: 3, y: 5 };
      expect(determineCourtZone(position)).toBe('front_right');
    });

    it('should return back_left for back-left position', () => {
      const position = { x: 10, y: 1 };
      expect(determineCourtZone(position)).toBe('back_left');
    });

    it('should return back_right for back-right position', () => {
      const position = { x: 10, y: 5 };
      expect(determineCourtZone(position)).toBe('back_right');
    });

    it('should return unknown for position outside court', () => {
      const position = { x: 15, y: 7 };
      expect(determineCourtZone(position)).toBe('unknown');
    });

    it('should return unknown for negative x coordinate', () => {
      const position = { x: -1, y: 3 };
      expect(determineCourtZone(position)).toBe('unknown');
    });

    it('should return valid zone for negative y coordinate within court bounds', () => {
      const position = { x: 3, y: -1 };
      expect(determineCourtZone(position)).toBe('front_left');
    });
  });

  describe('calculateAccuracyPercent', () => {
    it('should return 100% for 0cm distance', () => {
      expect(calculateAccuracyPercent(0)).toBe(100);
    });

    it('should return 75% for 50cm distance', () => {
      expect(calculateAccuracyPercent(50)).toBe(75);
    });

    it('should return 50% for 100cm distance', () => {
      expect(calculateAccuracyPercent(100)).toBe(50);
    });

    it('should return 0% for 200cm or more', () => {
      expect(calculateAccuracyPercent(200)).toBe(0);
      expect(calculateAccuracyPercent(300)).toBe(0);
    });

    it('should never return negative percentage', () => {
      expect(calculateAccuracyPercent(500)).toBe(0);
    });
  });

  describe('calculateScore', () => {
    it('should return 100 for perfect landing (0cm)', () => {
      expect(calculateScore(0, null)).toBe(100);
    });

    it('should return 100 for perfect landing when in_box is true', () => {
      expect(calculateScore(0, true)).toBe(100);
    });

    it('should clamp to 75 minimum when in_box is true and raw score is lower', () => {
      expect(calculateScore(50, true)).toBe(75);   // raw = 50, clamped to 75
      expect(calculateScore(100, true)).toBe(75);  // raw = 0, clamped to 75
      expect(calculateScore(200, true)).toBe(75);  // raw = 0, clamped to 75
    });

    it('should not clamp when in_box is false', () => {
      expect(calculateScore(50, false)).toBe(50);
      expect(calculateScore(100, false)).toBe(0);
    });

    it('should not clamp when in_box is null', () => {
      expect(calculateScore(50, null)).toBe(50);
      expect(calculateScore(100, null)).toBe(0);
    });

    it('should not clamp when in_box is undefined', () => {
      expect(calculateScore(50, undefined)).toBe(50);
    });

    it('should return 75 (no clamp needed) when raw score equals 75', () => {
      expect(calculateScore(25, true)).toBe(75);   // raw = 75, no clamping needed
      expect(calculateScore(25, false)).toBe(75);  // same without template
    });

    it('should never return negative score', () => {
      expect(calculateScore(500, false)).toBe(0);
      expect(calculateScore(500, null)).toBe(0);
    });
  });
});

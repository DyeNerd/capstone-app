import { templateService } from '../../../services/template.service';
import { PRESET_TEMPLATES } from '../../../constants/templates';

describe('TemplateService', () => {
  describe('getAllTemplates', () => {
    it('should return all preset templates', () => {
      const templates = templateService.getAllTemplates();

      expect(templates).toEqual(PRESET_TEMPLATES);
      expect(templates).toHaveLength(PRESET_TEMPLATES.length);
    });

    it('should return array with at least one template', () => {
      const templates = templateService.getAllTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should return templates with required properties', () => {
      const templates = templateService.getAllTemplates();

      templates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('positions');
        expect(Array.isArray(template.positions)).toBe(true);
      });
    });
  });

  describe('getTemplateById', () => {
    it('should return template when ID exists', () => {
      const template = templateService.getTemplateById('template-001');

      expect(template).not.toBeNull();
      expect(template?.id).toBe('template-001');
      expect(template?.name).toBe('template-001');
      expect(template?.description).toBe('first template');
    });

    it('should return null for non-existent template ID', () => {
      const template = templateService.getTemplateById('non-existent-id');

      expect(template).toBeNull();
    });

    it('should return null for empty string ID', () => {
      const template = templateService.getTemplateById('');

      expect(template).toBeNull();
    });

    it('should return template with all positions', () => {
      const template = templateService.getTemplateById('template-001');

      expect(template).not.toBeNull();
      expect(template?.positions).toHaveLength(3);

      // Verify first position
      expect(template?.positions[0]).toEqual({
        positionIndex: 0,
        box: { x1: 46, y1: -594, x2: 122, y2: -670 },
        dot: { x: 46, y: -670 },
      });

      // Verify second position
      expect(template?.positions[1]).toEqual({
        positionIndex: 1,
        box: { x1: 488, y1: -198, x2: 564, y2: -274 },
        dot: { x: 526, y: -236 },
      });

      // Verify third position
      expect(template?.positions[2]).toEqual({
        positionIndex: 2,
        box: { x1: 488, y1: 0, x2: 564, y2: -76 },
        dot: { x: 526, y: -38 },
      });
    });
  });

  describe('getTargetForShot', () => {
    it('should return first position for shot number 0', () => {
      const target = templateService.getTargetForShot('template-001', 0);

      expect(target).not.toBeNull();
      expect(target?.positionIndex).toBe(0);
      expect(target?.dot).toEqual({ x: 46, y: -670 });
    });

    it('should return second position for shot number 1', () => {
      const target = templateService.getTargetForShot('template-001', 1);

      expect(target).not.toBeNull();
      expect(target?.positionIndex).toBe(1);
      expect(target?.dot).toEqual({ x: 526, y: -236 });
    });

    it('should return third position for shot number 2', () => {
      const target = templateService.getTargetForShot('template-001', 2);

      expect(target).not.toBeNull();
      expect(target?.positionIndex).toBe(2);
      expect(target?.dot).toEqual({ x: 526, y: -38 });
    });

    it('should cycle back to first position for shot number 3', () => {
      const target = templateService.getTargetForShot('template-001', 3);

      expect(target).not.toBeNull();
      expect(target?.positionIndex).toBe(0);
      expect(target?.dot).toEqual({ x: 46, y: -670 });
    });

    it('should correctly cycle through positions for multiple shots', () => {
      // Test cycling: 0→1→2→0→1→2→0→1→2→0
      const expectedPositions = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0];

      expectedPositions.forEach((expectedIndex, shotNumber) => {
        const target = templateService.getTargetForShot('template-001', shotNumber);
        expect(target?.positionIndex).toBe(expectedIndex);
      });
    });

    it('should handle large shot numbers with correct cycling', () => {
      // Shot number 100 should map to position 100 % 3 = 1
      const target = templateService.getTargetForShot('template-001', 100);

      expect(target).not.toBeNull();
      expect(target?.positionIndex).toBe(1);
    });

    it('should return null for non-existent template ID', () => {
      const target = templateService.getTargetForShot('non-existent-id', 0);

      expect(target).toBeNull();
    });

    it('should return null for empty template ID', () => {
      const target = templateService.getTargetForShot('', 0);

      expect(target).toBeNull();
    });

    it('should return complete target position with box and dot', () => {
      const target = templateService.getTargetForShot('template-001', 0);

      expect(target).not.toBeNull();
      expect(target).toHaveProperty('positionIndex');
      expect(target).toHaveProperty('box');
      expect(target).toHaveProperty('dot');
      expect(target?.box).toHaveProperty('x1');
      expect(target?.box).toHaveProperty('y1');
      expect(target?.box).toHaveProperty('x2');
      expect(target?.box).toHaveProperty('y2');
      expect(target?.dot).toHaveProperty('x');
      expect(target?.dot).toHaveProperty('y');
    });
  });

  describe('template data integrity', () => {
    it('should have valid coordinate values within half-court bounds', () => {
      const templates = templateService.getAllTemplates();
      const MAX_X = 610; // Half-court width in cm
      const MIN_Y = -670; // Half-court depth in cm (y: 0 at net, -670 at baseline)

      templates.forEach((template) => {
        template.positions.forEach((position) => {
          // Check box coordinates
          expect(position.box.x1).toBeGreaterThanOrEqual(0);
          expect(position.box.x1).toBeLessThanOrEqual(MAX_X);
          expect(position.box.x2).toBeGreaterThanOrEqual(0);
          expect(position.box.x2).toBeLessThanOrEqual(MAX_X);
          expect(position.box.y1).toBeGreaterThanOrEqual(MIN_Y);
          expect(position.box.y1).toBeLessThanOrEqual(0);
          expect(position.box.y2).toBeGreaterThanOrEqual(MIN_Y);
          expect(position.box.y2).toBeLessThanOrEqual(0);

          // Check dot coordinates
          expect(position.dot.x).toBeGreaterThanOrEqual(0);
          expect(position.dot.x).toBeLessThanOrEqual(MAX_X);
          expect(position.dot.y).toBeGreaterThanOrEqual(MIN_Y);
          expect(position.dot.y).toBeLessThanOrEqual(0);
        });
      });
    });

    it('should have sequential position indices starting from 0', () => {
      const templates = templateService.getAllTemplates();

      templates.forEach((template) => {
        template.positions.forEach((position, index) => {
          expect(position.positionIndex).toBe(index);
        });
      });
    });

    it('should have unique template IDs', () => {
      const templates = templateService.getAllTemplates();
      const ids = templates.map((t) => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});

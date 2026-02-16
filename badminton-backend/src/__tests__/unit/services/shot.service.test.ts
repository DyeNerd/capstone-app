import { shotService } from '../../../services/shot.service';
import { AppDataSource } from '../../../config/database';
import { Shot } from '../../../models/Shot';
import { createMockRepository } from '../../mocks/database.mock';

// Mock dependencies
jest.mock('../../../config/database');

describe('ShotService', () => {
  let mockShotRepository: ReturnType<typeof createMockRepository<Shot>>;

  beforeEach(() => {
    // Reset the service's cached repository
    (shotService as any)._shotRepository = undefined;

    mockShotRepository = createMockRepository<Shot>();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockShotRepository);
    jest.clearAllMocks();
  });

  describe('createShot', () => {
    it('should successfully create a shot', async () => {
      const shotData = {
        sessionId: 'session-123',
        shotNumber: 1,
        timestamp: new Date(),
        landingPositionX: 5.5,
        landingPositionY: 3.2,
        targetPositionX: 5.0,
        targetPositionY: 3.0,
        accuracyCm: 15.5,
        accuracyPercent: 85,
        velocityKmh: 120,
        detectionConfidence: 0.95,
        wasSuccessful: true,
        courtZone: 'front_left' as const,
      };

      const mockShot = {
        id: 'shot-123',
        session: { id: 'session-123' },
        shot_number: 1,
        timestamp: shotData.timestamp,
        landing_position_x: 5.5,
        landing_position_y: 3.2,
        target_position_x: 5.0,
        target_position_y: 3.0,
        accuracy_cm: 15.5,
        accuracy_percent: 85,
        velocity_kmh: 120,
        detection_confidence: 0.95,
        was_successful: true,
        court_zone: 'front_left',
      };

      mockShotRepository.create.mockReturnValue(mockShot as Shot);
      mockShotRepository.save.mockResolvedValue(mockShot as Shot);

      const result = await shotService.createShot(shotData);

      expect(mockShotRepository.create).toHaveBeenCalledWith({
        session: { id: 'session-123' },
        shot_number: 1,
        timestamp: shotData.timestamp,
        landing_position_x: 5.5,
        landing_position_y: 3.2,
        target_position_x: 5.0,
        target_position_y: 3.0,
        accuracy_cm: 15.5,
        accuracy_percent: 85,
        velocity_kmh: 120,
        detection_confidence: 0.95,
        was_successful: true,
        court_zone: 'front_left',
      });
      expect(mockShotRepository.save).toHaveBeenCalledWith(mockShot);
      expect(result.id).toBe('shot-123');
      expect(result.accuracy_percent).toBe(85);
    });

    it('should create shot with optional fields undefined', async () => {
      const shotData = {
        sessionId: 'session-123',
        shotNumber: 2,
        timestamp: new Date(),
        landingPositionX: 6.0,
        landingPositionY: 4.0,
        targetPositionX: 6.0,
        targetPositionY: 4.0,
        accuracyCm: 0,
        accuracyPercent: 100,
        wasSuccessful: true,
        courtZone: 'front_right' as const,
      };

      const mockShot = {
        id: 'shot-456',
        session: { id: 'session-123' },
        shot_number: 2,
        timestamp: shotData.timestamp,
        landing_position_x: 6.0,
        landing_position_y: 4.0,
        target_position_x: 6.0,
        target_position_y: 4.0,
        accuracy_cm: 0,
        accuracy_percent: 100,
        velocity_kmh: undefined,
        detection_confidence: undefined,
        was_successful: true,
        court_zone: 'front_right',
      };

      mockShotRepository.create.mockReturnValue(mockShot as Shot);
      mockShotRepository.save.mockResolvedValue(mockShot as Shot);

      const result = await shotService.createShot(shotData);

      expect(result.velocity_kmh).toBeUndefined();
      expect(result.detection_confidence).toBeUndefined();
    });
  });

  describe('getShotsBySessionId', () => {
    it('should get all shots for a session ordered by shot number', async () => {
      const mockShots = [
        {
          id: 'shot-1',
          session: { id: 'session-123' },
          shot_number: 1,
          accuracy_percent: 85,
          timestamp: new Date(),
        },
        {
          id: 'shot-2',
          session: { id: 'session-123' },
          shot_number: 2,
          accuracy_percent: 90,
          timestamp: new Date(),
        },
        {
          id: 'shot-3',
          session: { id: 'session-123' },
          shot_number: 3,
          accuracy_percent: 80,
          timestamp: new Date(),
        },
      ];

      mockShotRepository.find.mockResolvedValue(mockShots as Shot[]);

      const result = await shotService.getShotsBySessionId('session-123');

      expect(mockShotRepository.find).toHaveBeenCalledWith({
        where: { session: { id: 'session-123' } },
        order: { shot_number: 'ASC' },
      });
      expect(result).toEqual(mockShots);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no shots found', async () => {
      mockShotRepository.find.mockResolvedValue([]);

      const result = await shotService.getShotsBySessionId('session-456');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should maintain shot order by shot_number', async () => {
      const mockShots = [
        { id: 'shot-1', shot_number: 1 },
        { id: 'shot-2', shot_number: 2 },
        { id: 'shot-3', shot_number: 3 },
      ];

      mockShotRepository.find.mockResolvedValue(mockShots as Shot[]);

      const result = await shotService.getShotsBySessionId('session-123');

      expect(result[0].shot_number).toBe(1);
      expect(result[1].shot_number).toBe(2);
      expect(result[2].shot_number).toBe(3);
    });
  });

  describe('getShotById', () => {
    it('should successfully get shot by id', async () => {
      const mockShot = {
        id: 'shot-123',
        session: { id: 'session-123' },
        shot_number: 1,
        accuracy_percent: 85,
        velocity_kmh: 120,
        was_successful: true,
        timestamp: new Date(),
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot as Shot);

      const result = await shotService.getShotById('shot-123');

      expect(mockShotRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'shot-123' },
      });
      expect(result).toEqual(mockShot);
    });

    it('should throw error if shot not found', async () => {
      mockShotRepository.findOne.mockResolvedValue(null);

      await expect(shotService.getShotById('nonexistent-id')).rejects.toThrow('Shot not found');

      expect(mockShotRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
      });
    });
  });

  describe('template-related shot fields', () => {
    it('should create shot with inBox and targetPositionIndex fields', async () => {
      const shotData = {
        sessionId: 'session-123',
        shotNumber: 1,
        timestamp: new Date(),
        landingPositionX: 0.84,
        landingPositionY: 6.32,
        targetPositionX: 0.46,
        targetPositionY: 6.70,
        accuracyCm: 50.6,
        accuracyPercent: 74.7,
        velocityKmh: 110,
        detectionConfidence: 0.92,
        wasSuccessful: false,
        courtZone: 'back_left' as const,
        inBox: true,
        targetPositionIndex: 0,
      };

      const mockShot = {
        id: 'shot-template',
        session: { id: 'session-123' },
        shot_number: 1,
        timestamp: shotData.timestamp,
        landing_position_x: 0.84,
        landing_position_y: 6.32,
        target_position_x: 0.46,
        target_position_y: 6.70,
        accuracy_cm: 50.6,
        accuracy_percent: 74.7,
        velocity_kmh: 110,
        detection_confidence: 0.92,
        was_successful: false,
        court_zone: 'back_left',
        in_box: true,
        target_position_index: 0,
      };

      mockShotRepository.create.mockReturnValue(mockShot as Shot);
      mockShotRepository.save.mockResolvedValue(mockShot as Shot);

      const result = await shotService.createShot(shotData);

      expect(mockShotRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          in_box: true,
          target_position_index: 0,
        })
      );
      expect(result.in_box).toBe(true);
      expect(result.target_position_index).toBe(0);
    });

    it('should create shot with inBox=false when landing outside target box', async () => {
      const shotData = {
        sessionId: 'session-123',
        shotNumber: 2,
        timestamp: new Date(),
        landingPositionX: 3.0,
        landingPositionY: 3.0,
        targetPositionX: 5.26,
        targetPositionY: 2.36,
        accuracyCm: 230,
        accuracyPercent: 0,
        velocityKmh: 95,
        detectionConfidence: 0.88,
        wasSuccessful: false,
        courtZone: 'front_right' as const,
        inBox: false,
        targetPositionIndex: 1,
      };

      const mockShot = {
        id: 'shot-outside-box',
        session: { id: 'session-123' },
        shot_number: 2,
        timestamp: shotData.timestamp,
        landing_position_x: 3.0,
        landing_position_y: 3.0,
        target_position_x: 5.26,
        target_position_y: 2.36,
        accuracy_cm: 230,
        accuracy_percent: 0,
        velocity_kmh: 95,
        detection_confidence: 0.88,
        was_successful: false,
        court_zone: 'front_right',
        in_box: false,
        target_position_index: 1,
      };

      mockShotRepository.create.mockReturnValue(mockShot as Shot);
      mockShotRepository.save.mockResolvedValue(mockShot as Shot);

      const result = await shotService.createShot(shotData);

      expect(result.in_box).toBe(false);
      expect(result.target_position_index).toBe(1);
    });

    it('should create shot without template fields when not using template', async () => {
      const shotData = {
        sessionId: 'session-123',
        shotNumber: 1,
        timestamp: new Date(),
        landingPositionX: 5.0,
        landingPositionY: 3.0,
        targetPositionX: 5.0,
        targetPositionY: 3.0,
        accuracyCm: 0,
        accuracyPercent: 100,
        wasSuccessful: true,
        courtZone: 'front_left' as const,
        // inBox and targetPositionIndex not provided
      };

      const mockShot = {
        id: 'shot-no-template',
        session: { id: 'session-123' },
        shot_number: 1,
        timestamp: shotData.timestamp,
        landing_position_x: 5.0,
        landing_position_y: 3.0,
        target_position_x: 5.0,
        target_position_y: 3.0,
        accuracy_cm: 0,
        accuracy_percent: 100,
        was_successful: true,
        court_zone: 'front_left',
        in_box: undefined,
        target_position_index: undefined,
      };

      mockShotRepository.create.mockReturnValue(mockShot as Shot);
      mockShotRepository.save.mockResolvedValue(mockShot as Shot);

      const result = await shotService.createShot(shotData);

      expect(mockShotRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          in_box: undefined,
          target_position_index: undefined,
        })
      );
      expect(result.in_box).toBeUndefined();
      expect(result.target_position_index).toBeUndefined();
    });

    it('should correctly handle cycling through position indices', async () => {
      // Simulate shots cycling through positions 0, 1, 2, 0, 1, 2...
      const positionIndices = [0, 1, 2, 0, 1, 2];

      for (let i = 0; i < positionIndices.length; i++) {
        const shotData = {
          sessionId: 'session-123',
          shotNumber: i,
          timestamp: new Date(),
          landingPositionX: 5.0,
          landingPositionY: 3.0,
          targetPositionX: 5.0,
          targetPositionY: 3.0,
          accuracyCm: 10,
          accuracyPercent: 95,
          wasSuccessful: true,
          courtZone: 'front_left' as const,
          inBox: true,
          targetPositionIndex: positionIndices[i],
        };

        const mockShot = {
          id: `shot-${i}`,
          session: { id: 'session-123' },
          shot_number: i,
          timestamp: shotData.timestamp,
          landing_position_x: 5.0,
          landing_position_y: 3.0,
          target_position_x: 5.0,
          target_position_y: 3.0,
          accuracy_cm: 10,
          accuracy_percent: 95,
          was_successful: true,
          court_zone: 'front_left',
          in_box: true,
          target_position_index: positionIndices[i],
        };

        mockShotRepository.create.mockReturnValue(mockShot as Shot);
        mockShotRepository.save.mockResolvedValue(mockShot as Shot);

        const result = await shotService.createShot(shotData);

        expect(result.target_position_index).toBe(positionIndices[i]);
      }
    });
  });

  describe('shot data validation edge cases', () => {
    it('should handle maximum accuracy (perfect shot)', async () => {
      const perfectShot = {
        sessionId: 'session-123',
        shotNumber: 1,
        timestamp: new Date(),
        landingPositionX: 5.0,
        landingPositionY: 3.0,
        targetPositionX: 5.0,
        targetPositionY: 3.0,
        accuracyCm: 0,
        accuracyPercent: 100,
        velocityKmh: 150,
        detectionConfidence: 1.0,
        wasSuccessful: true,
        courtZone: 'back_left' as const,
      };

      const mockShot = {
        id: 'shot-perfect',
        session: { id: 'session-123' },
        shot_number: 1,
        timestamp: perfectShot.timestamp,
        landing_position_x: 5.0,
        landing_position_y: 3.0,
        target_position_x: 5.0,
        target_position_y: 3.0,
        accuracy_cm: 0,
        accuracy_percent: 100,
        velocity_kmh: 150,
        detection_confidence: 1.0,
        was_successful: true,
        court_zone: 'back_left',
      };

      mockShotRepository.create.mockReturnValue(mockShot as never);
      mockShotRepository.save.mockResolvedValue(mockShot as never);

      const result = await shotService.createShot(perfectShot);

      expect(result.accuracy_cm).toBe(0);
      expect(result.accuracy_percent).toBe(100);
      expect(result.was_successful).toBe(true);
    });

    it('should handle minimum accuracy (failed shot)', async () => {
      const failedShot = {
        sessionId: 'session-123',
        shotNumber: 1,
        timestamp: new Date(),
        landingPositionX: 1.0,
        landingPositionY: 1.0,
        targetPositionX: 10.0,
        targetPositionY: 5.0,
        accuracyCm: 500,
        accuracyPercent: 0,
        velocityKmh: 50,
        detectionConfidence: 0.6,
        wasSuccessful: false,
        courtZone: 'unknown' as const,
      };

      const mockShot = {
        id: 'shot-failed',
        session: { id: 'session-123' },
        shot_number: 1,
        timestamp: failedShot.timestamp,
        landing_position_x: 1.0,
        landing_position_y: 1.0,
        target_position_x: 10.0,
        target_position_y: 5.0,
        accuracy_cm: 500,
        accuracy_percent: 0,
        velocity_kmh: 50,
        detection_confidence: 0.6,
        was_successful: false,
        court_zone: 'unknown',
      };

      mockShotRepository.create.mockReturnValue(mockShot as never);
      mockShotRepository.save.mockResolvedValue(mockShot as never);

      const result = await shotService.createShot(failedShot);

      expect(result.was_successful).toBe(false);
      expect(result.accuracy_percent).toBe(0);
    });
  });
});

import { sessionService } from '../../../services/session.service';
import { AppDataSource } from '../../../config/database';
import { TrainingSession } from '../../../models/TrainingSession';
import { createMockRepository } from '../../mocks/database.mock';

// Mock dependencies
jest.mock('../../../config/database');

describe('SessionService', () => {
  let mockSessionRepository: ReturnType<typeof createMockRepository<TrainingSession>>;

  beforeEach(() => {
    mockSessionRepository = createMockRepository<TrainingSession>();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockSessionRepository);
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should successfully create a training session', async () => {
      const sessionData = {
        athleteId: 'athlete-123',
        coachId: 'coach-123',
        startTime: new Date(),
        status: 'active' as const,
        targetZone: 'front_court',
      };

      const mockSession = {
        id: 'session-123',
        athlete: { id: 'athlete-123' },
        coach: { id: 'coach-123' },
        start_time: sessionData.startTime,
        status: 'active',
        target_zone: 'front_court',
      };

      mockSessionRepository.create.mockReturnValue(mockSession as unknown as TrainingSession);
      mockSessionRepository.save.mockResolvedValue(mockSession as unknown as TrainingSession);

      const result = await sessionService.createSession(sessionData);

      expect(mockSessionRepository.create).toHaveBeenCalledWith({
        athlete: { id: 'athlete-123' },
        coach: { id: 'coach-123' },
        start_time: sessionData.startTime,
        status: 'in_progress',
        target_zone: 'front_court',
      });
      expect(mockSessionRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('session-123');
    });
  });

  describe('getSessionById', () => {
    it('should successfully get session by id with default relations', async () => {
      const mockSession = {
        id: 'session-123',
        athlete: { id: 'athlete-123', athlete_name: 'John Doe' },
        coach: { id: 'coach-123', username: 'coach' },
        shots: [],
        start_time: new Date(),
        status: 'completed',
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as TrainingSession);

      const result = await sessionService.getSessionById('session-123');

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        relations: ['athlete', 'coach', 'shots'],
      });
      expect(result).toEqual(mockSession);
    });

    it('should get session with custom relations', async () => {
      const mockSession = {
        id: 'session-123',
        athlete: { id: 'athlete-123' },
        start_time: new Date(),
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as unknown as TrainingSession);

      await sessionService.getSessionById('session-123', ['athlete']);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        relations: ['athlete'],
      });
    });

    it('should throw error if session not found', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(sessionService.getSessionById('nonexistent-id')).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('listSessions', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    beforeEach(() => {
      mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as never);
    });

    it('should list sessions with default pagination', async () => {
      const mockSessions = [
        { id: 'session-1', start_time: new Date() },
        { id: 'session-2', start_time: new Date() },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockSessions, 2]);

      const result = await sessionService.listSessions();

      expect(mockSessionRepository.createQueryBuilder).toHaveBeenCalledWith('session');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('session.athlete', 'athlete');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('session.coach', 'coach');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('session.start_time', 'DESC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        sessions: mockSessions,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter sessions by athlete ID', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await sessionService.listSessions({ athleteId: 'athlete-123' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.athlete_id = :athleteId', {
        athleteId: 'athlete-123',
      });
    });

    it('should filter sessions by status', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await sessionService.listSessions({ status: 'completed' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.status = :status', {
        status: 'completed',
      });
    });

    it('should filter sessions by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await sessionService.listSessions({ startDate, endDate });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.start_time >= :startDate', {
        startDate,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.start_time <= :endDate', {
        endDate,
      });
    });

    it('should handle custom pagination', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 50]);

      const result = await sessionService.listSessions({ page: 3, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20); // (3-1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.totalPages).toBe(5); // 50 / 10
    });
  });

  describe('stopSession', () => {
    it('should successfully stop a session', async () => {
      const mockSession = {
        id: 'session-123',
        athlete: { id: 'athlete-123' },
        coach: { id: 'coach-123' },
        start_time: new Date(),
        status: 'in_progress',
      };

      const stopData = {
        endTime: new Date(),
        status: 'completed' as const,
        sessionNotes: 'Great session',
        sessionRating: 5,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as unknown as TrainingSession);
      mockSessionRepository.save.mockResolvedValue({
        ...mockSession,
        end_time: stopData.endTime,
        status: 'completed',
        session_notes: 'Great session',
        session_rating: 5,
      } as unknown as TrainingSession);

      const result = await sessionService.stopSession('session-123', stopData);

      expect(result.status).toBe('completed');
      expect(result.session_notes).toBe('Great session');
      expect(result.session_rating).toBe(5);
    });
  });

  describe('updateSessionStats', () => {
    it('should calculate and update session stats from shots', async () => {
      const mockShots = [
        { accuracy_percent: 80, velocity_kmh: 120, was_successful: true },
        { accuracy_percent: 90, velocity_kmh: 130, was_successful: true },
        { accuracy_percent: 70, velocity_kmh: 110, was_successful: false },
      ];

      const mockSession = {
        id: 'session-123',
        shots: mockShots,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as TrainingSession);
      mockSessionRepository.save.mockImplementation((session) => Promise.resolve(session));

      const result = await sessionService.updateSessionStats('session-123');

      expect(result.total_shots).toBe(3);
      expect(result.successful_shots).toBe(2);
      expect(result.average_accuracy_percent).toBe(80); // (80+90+70)/3
      expect(result.average_shot_velocity_kmh).toBe(120); // (120+130+110)/3
    });

    it('should handle session with no shots', async () => {
      const mockSession = {
        id: 'session-123',
        shots: [],
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as unknown as TrainingSession);

      const result = await sessionService.updateSessionStats('session-123');

      expect(result.shots).toEqual([]);
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('incrementalUpdateStats', () => {
    it('should update stats incrementally with running average', async () => {
      const mockSession = {
        id: 'session-123',
        total_shots: 2,
        successful_shots: 1,
        average_accuracy_percent: 75,
        average_shot_velocity_kmh: 100,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as TrainingSession);
      mockSessionRepository.save.mockImplementation((session) => Promise.resolve(session));

      const result = await sessionService.incrementalUpdateStats('session-123', 90, 120, true);

      expect(result.total_shots).toBe(3);
      expect(result.successful_shots).toBe(2);
      // New avg accuracy: (75*2 + 90) / 3 = 80
      expect(result.average_accuracy_percent).toBe(80);
      // New avg velocity: (100*2 + 120) / 3 = 106.666...
      expect(result.average_shot_velocity_kmh).toBeCloseTo(106.67, 1);
    });

    it('should handle first shot in session', async () => {
      const mockSession = {
        id: 'session-123',
        total_shots: 0,
        successful_shots: 0,
        average_accuracy_percent: 0,
        average_shot_velocity_kmh: 0,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as TrainingSession);
      mockSessionRepository.save.mockImplementation((session) => Promise.resolve(session));

      const result = await sessionService.incrementalUpdateStats('session-123', 85, 115, true);

      expect(result.total_shots).toBe(1);
      expect(result.successful_shots).toBe(1);
      expect(result.average_accuracy_percent).toBe(85);
      expect(result.average_shot_velocity_kmh).toBe(115);
    });

    it('should handle unsuccessful shot', async () => {
      const mockSession = {
        id: 'session-123',
        total_shots: 1,
        successful_shots: 1,
        average_accuracy_percent: 80,
        average_shot_velocity_kmh: 120,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as TrainingSession);
      mockSessionRepository.save.mockImplementation((session) => Promise.resolve(session));

      const result = await sessionService.incrementalUpdateStats('session-123', 60, 90, false);

      expect(result.total_shots).toBe(2);
      expect(result.successful_shots).toBe(1); // No increment for unsuccessful
      expect(result.average_accuracy_percent).toBe(70); // (80*1 + 60) / 2
      expect(result.average_shot_velocity_kmh).toBe(105); // (120*1 + 90) / 2
    });
  });

  describe('deleteSession', () => {
    it('should successfully delete session', async () => {
      mockSessionRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await sessionService.deleteSession('session-123');

      expect(mockSessionRepository.delete).toHaveBeenCalledWith('session-123');
      expect(result).toEqual({ success: true });
    });

    it('should throw error if session not found during delete', async () => {
      mockSessionRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(sessionService.deleteSession('nonexistent-id')).rejects.toThrow(
        'Session not found'
      );
    });
  });
});

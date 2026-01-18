import { athleteService } from '../../../services/athlete.service';
import { AppDataSource } from '../../../config/database';
import { Athlete } from '../../../models/Athlete';
import { createMockRepository } from '../../mocks/database.mock';

// Mock dependencies
jest.mock('../../../config/database');

describe('AthleteService', () => {
  let mockAthleteRepository: ReturnType<typeof createMockRepository<Athlete>>;

  beforeEach(() => {
    mockAthleteRepository = createMockRepository<Athlete>();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockAthleteRepository);
    jest.clearAllMocks();
  });

  describe('createAthlete', () => {
    it('should successfully create an athlete', async () => {
      const athleteData = {
        athlete_name: 'John Doe',
        date_of_birth: new Date('2000-01-01'),
        gender: 'male',
        skill_level: 'intermediate' as const,
        height_cm: 175,
        dominant_hand: 'right' as const,
        coach_id: 'coach-123',
        notes: 'Test notes',
      };

      const mockAthlete = {
        id: 'athlete-123',
        ...athleteData,
        coach: { id: 'coach-123' },
        created_at: new Date(),
        updated_at: new Date(),
        training_sessions: [],
      };

      mockAthleteRepository.create.mockReturnValue(mockAthlete as unknown as Athlete);
      mockAthleteRepository.save.mockResolvedValue(mockAthlete as unknown as Athlete);

      const result = await athleteService.createAthlete(athleteData);

      expect(mockAthleteRepository.create).toHaveBeenCalledWith({
        ...athleteData,
        coach: { id: 'coach-123' },
      });
      expect(mockAthleteRepository.save).toHaveBeenCalledWith(mockAthlete);
      expect(result).toEqual(mockAthlete);
    });

    it('should create athlete with minimal required fields', async () => {
      const athleteData = {
        athlete_name: 'Jane Doe',
        skill_level: 'beginner' as const,
        coach_id: 'coach-456',
      };

      const mockAthlete = {
        id: 'athlete-456',
        ...athleteData,
        coach: { id: 'coach-456' },
        created_at: new Date(),
        updated_at: new Date(),
        training_sessions: [],
      };

      mockAthleteRepository.create.mockReturnValue(mockAthlete as unknown as Athlete);
      mockAthleteRepository.save.mockResolvedValue(mockAthlete as unknown as Athlete);

      const result = await athleteService.createAthlete(athleteData);

      expect(mockAthleteRepository.create).toHaveBeenCalled();
      expect(mockAthleteRepository.save).toHaveBeenCalled();
      expect(result.athlete_name).toBe('Jane Doe');
    });
  });

  describe('getAthleteById', () => {
    it('should successfully get athlete by id', async () => {
      const mockAthlete = {
        id: 'athlete-123',
        athlete_name: 'John Doe',
        skill_level: 'intermediate',
        coach: { id: 'coach-123', email: 'coach@example.com' },
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAthleteRepository.findOne.mockResolvedValue(mockAthlete as Athlete);

      const result = await athleteService.getAthleteById('athlete-123');

      expect(mockAthleteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'athlete-123' },
        relations: ['coach'],
      });
      expect(result).toEqual(mockAthlete);
    });

    it('should throw error if athlete not found', async () => {
      mockAthleteRepository.findOne.mockResolvedValue(null);

      await expect(athleteService.getAthleteById('nonexistent-id')).rejects.toThrow(
        'Athlete not found'
      );

      expect(mockAthleteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
        relations: ['coach'],
      });
    });
  });

  describe('listAthletes', () => {
    it('should list all athletes when no coach ID provided', async () => {
      const mockAthletes = [
        {
          id: 'athlete-1',
          athlete_name: 'Athlete 1',
          skill_level: 'beginner',
          coach: { id: 'coach-1' },
          created_at: new Date('2024-01-01'),
        },
        {
          id: 'athlete-2',
          athlete_name: 'Athlete 2',
          skill_level: 'intermediate',
          coach: { id: 'coach-2' },
          created_at: new Date('2024-01-02'),
        },
      ];

      mockAthleteRepository.find.mockResolvedValue(mockAthletes as Athlete[]);

      const result = await athleteService.listAthletes();

      expect(mockAthleteRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['coach'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockAthletes);
      expect(result).toHaveLength(2);
    });

    it('should list athletes filtered by coach ID', async () => {
      const mockAthletes = [
        {
          id: 'athlete-1',
          athlete_name: 'Athlete 1',
          skill_level: 'beginner',
          coach: { id: 'coach-123' },
          created_at: new Date(),
        },
      ];

      mockAthleteRepository.find.mockResolvedValue(mockAthletes as Athlete[]);

      const result = await athleteService.listAthletes('coach-123');

      expect(mockAthleteRepository.find).toHaveBeenCalledWith({
        where: { coach: { id: 'coach-123' } },
        relations: ['coach'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockAthletes);
    });

    it('should return empty array when no athletes found', async () => {
      mockAthleteRepository.find.mockResolvedValue([]);

      const result = await athleteService.listAthletes('coach-123');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('updateAthlete', () => {
    it('should successfully update athlete', async () => {
      const existingAthlete = {
        id: 'athlete-123',
        athlete_name: 'John Doe',
        skill_level: 'beginner',
        coach: { id: 'coach-123' },
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updateData = {
        athlete_name: 'John Updated',
        skill_level: 'intermediate' as const,
      };

      const updatedAthlete = {
        ...existingAthlete,
        ...updateData,
      };

      mockAthleteRepository.findOne.mockResolvedValue(existingAthlete as Athlete);
      mockAthleteRepository.save.mockResolvedValue(updatedAthlete as Athlete);

      const result = await athleteService.updateAthlete('athlete-123', updateData);

      expect(mockAthleteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'athlete-123' },
        relations: ['coach'],
      });
      expect(mockAthleteRepository.save).toHaveBeenCalled();
      expect(result.athlete_name).toBe('John Updated');
      expect(result.skill_level).toBe('intermediate');
    });

    it('should throw error if athlete not found during update', async () => {
      mockAthleteRepository.findOne.mockResolvedValue(null);

      await expect(
        athleteService.updateAthlete('nonexistent-id', { athlete_name: 'New Name' })
      ).rejects.toThrow('Athlete not found');

      expect(mockAthleteRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteAthlete', () => {
    it('should successfully delete athlete', async () => {
      mockAthleteRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await athleteService.deleteAthlete('athlete-123');

      expect(mockAthleteRepository.delete).toHaveBeenCalledWith('athlete-123');
      expect(result).toEqual({ success: true });
    });

    it('should throw error if athlete not found during delete', async () => {
      mockAthleteRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(athleteService.deleteAthlete('nonexistent-id')).rejects.toThrow(
        'Athlete not found'
      );

      expect(mockAthleteRepository.delete).toHaveBeenCalledWith('nonexistent-id');
    });
  });
});

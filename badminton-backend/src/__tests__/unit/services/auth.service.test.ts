import bcrypt from 'bcrypt';
import { authService } from '../../../services/auth.service';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../models/User';
import { createMockRepository } from '../../mocks/database.mock';
import * as jwtUtils from '../../../utils/jwt.utils';

// Mock dependencies
jest.mock('../../../config/database');
jest.mock('../../../utils/jwt.utils');
jest.mock('bcrypt');

describe('AuthService', () => {
  let mockUserRepository: ReturnType<typeof createMockRepository<User>>;

  beforeEach(() => {
    mockUserRepository = createMockRepository<User>();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password',
        created_at: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser as User);
      mockUserRepository.save.mockResolvedValue(mockUser as User);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');

      const result = await authService.register('test@example.com', 'testuser', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(jwtUtils.generateToken).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          created_at: mockUser.created_at,
        },
        token: 'mock_jwt_token',
      });
    });

    it('should throw error if user already exists', async () => {
      const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: 'existinguser',
        password_hash: 'hashed_password',
        created_at: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser as User);

      await expect(
        authService.register('test@example.com', 'testuser', 'password123')
      ).rejects.toThrow('User already exists with this email');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should handle bcrypt hashing errors', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(
        authService.register('test@example.com', 'testuser', 'password123')
      ).rejects.toThrow('Hashing failed');

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password',
        created_at: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');

      const result = await authService.login('test@example.com', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(jwtUtils.generateToken).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          created_at: mockUser.created_at,
        },
        token: 'mock_jwt_token',
      });
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if password is invalid', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password',
        created_at: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashed_password');
      expect(jwtUtils.generateToken).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should successfully get user by id', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password',
        created_at: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await authService.getUserById('123e4567-e89b-12d3-a456-426614174000');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        created_at: mockUser.created_at,
      });
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        authService.getUserById('nonexistent-id')
      ).rejects.toThrow('User not found');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
      });
    });
  });
});

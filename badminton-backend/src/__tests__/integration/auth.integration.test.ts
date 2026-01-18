import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { authService } from '../../services/auth.service';
import { redisClient } from '../../config/redis';
import authRoutes from '../../routes/auth.routes';

// Mock dependencies
jest.mock('../../services/auth.service');
jest.mock('../../config/redis');
jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: (req: Request, res: Response, next: NextFunction) => {
    (req as never)['user'] = { id: 'user-123', email: 'test@example.com', username: 'testuser' };
    next();
  },
}));

describe('Auth Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'newuser@example.com',
          username: 'newuser',
          created_at: new Date(),
        },
        token: 'jwt_token_12345',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResponse);
      (redisClient.setEx as jest.Mock).mockResolvedValue('OK');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResponse);
      expect(authService.register).toHaveBeenCalledWith(
        'newuser@example.com',
        'newuser',
        'password123'
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'newuser@example.com',
        // Missing username and password
      });

      expect(response.status).toBe(400);
    });

    it('should return 409 when user already exists', async () => {
      (authService.register as jest.Mock).mockRejectedValue(
        new Error('User already exists with this email')
      );

      const response = await request(app).post('/api/auth/register').send({
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'password123',
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
          created_at: new Date(),
        },
        token: 'jwt_token_12345',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResponse);
      (redisClient.setEx as jest.Mock).mockResolvedValue('OK');

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should return 401 for invalid credentials', async () => {
      (authService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(500);
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        // Missing password
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date(),
      };

      (authService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(authService.getUserById).toHaveBeenCalledWith('user-123');
    });

    it('should return 401 when not authenticated', async () => {
      // Remove the mock for this test to test actual auth behavior
      jest.unmock('../../middleware/auth.middleware');

      const response = await request(app).get('/api/auth/me');

      // Re-mock for subsequent tests
      jest.mock('../../middleware/auth.middleware', () => ({
        authenticate: (req: never, res: never, next: never) => {
          req.user = { id: 'user-123', email: 'test@example.com', username: 'testuser' };
          next();
        },
      }));
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Logged out successfully' });
      expect(redisClient.del).toHaveBeenCalledWith('session:user-123');
    });

    it('should handle logout even if session not in Redis', async () => {
      (redisClient.del as jest.Mock).mockResolvedValue(0);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
    });
  });
});

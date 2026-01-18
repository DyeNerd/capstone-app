import { Response, NextFunction } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { verifyToken } from '../../../utils/jwt.utils';
import { redisClient } from '../../../config/redis';
import { AuthRequest } from '../../../types';

// Mock dependencies
jest.mock('../../../utils/jwt.utils');
jest.mock('../../../config/redis');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token and session', async () => {
      const mockDecoded = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token_12345',
      };

      (verifyToken as jest.Mock).mockReturnValue(mockDecoded);
      (redisClient.get as jest.Mock).mockResolvedValue('session_data');

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(verifyToken).toHaveBeenCalledWith('valid_token_12345');
      expect(redisClient.get).toHaveBeenCalledWith('session:user-123');
      expect(mockRequest.user).toEqual(mockDecoded);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request with no authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token_12345',
      };

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with only "Bearer" without token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer',
      };

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid JWT token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token',
      };

      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with expired session in Redis', async () => {
      const mockDecoded = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token_12345',
      };

      (verifyToken as jest.Mock).mockReturnValue(mockDecoded);
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(redisClient.get).toHaveBeenCalledWith('session:user-123');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid session' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      const mockDecoded = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token_12345',
      };

      (verifyToken as jest.Mock).mockReturnValue(mockDecoded);
      (redisClient.get as jest.Mock).mockRejectedValue(new Error('Redis connection error'));

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should properly extract token from complex Bearer string', async () => {
      const mockDecoded = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockRequest.headers = {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
      };

      (verifyToken as jest.Mock).mockReturnValue(mockDecoded);
      (redisClient.get as jest.Mock).mockResolvedValue('session_data');

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(verifyToken).toHaveBeenCalledWith(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
      );
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});

import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../middleware/error.middleware';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('errorHandler', () => {
    it('should handle error with custom status code and message', () => {
      const error = {
        statusCode: 404,
        message: 'Resource not found',
        stack: 'Error stack trace',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error:', error);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found',
      });
    });

    it('should default to 500 status code if not provided', () => {
      const error = {
        message: 'Something went wrong',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Something went wrong',
      });
    });

    it('should use default message if not provided', () => {
      const error = {
        statusCode: 500,
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = {
        statusCode: 500,
        message: 'Test error',
        stack: 'Error: Test error\n    at someFunction (file.ts:10:5)',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        stack: 'Error: Test error\n    at someFunction (file.ts:10:5)',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = {
        statusCode: 500,
        message: 'Test error',
        stack: 'Error: Test error\n    at someFunction (file.ts:10:5)',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle various HTTP status codes', () => {
      const statusCodes = [400, 401, 403, 404, 422, 500, 503];

      statusCodes.forEach((statusCode) => {
        const error = {
          statusCode,
          message: `Error with status ${statusCode}`,
        };

        errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      });
    });

    it('should handle Error objects', () => {
      const error = new Error('Standard error object');
      (error as { statusCode?: number }).statusCode = 400;

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Standard error object',
      });
    });

    it('should log error to console', () => {
      const error = {
        statusCode: 500,
        message: 'Test logging',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error:', error);
    });
  });
});

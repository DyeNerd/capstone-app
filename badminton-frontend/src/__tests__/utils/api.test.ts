import { api } from '../../utils/api';

// Mock fetch
global.fetch = jest.fn();

describe('API Utilities', () => {
  const API_BASE_URL = 'http://localhost:5000/api';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Auth endpoints', () => {
    it('should register user', async () => {
      const mockResponse = {
        success: true,
        user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
        token: 'jwt_token',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should login user', async () => {
      const mockResponse = {
        success: true,
        user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
        token: 'jwt_token',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should logout user with auth token', async () => {
      localStorage.setItem('token', 'jwt_token');

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ success: true }),
      });

      await api.logout();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token',
        },
      });
    });

    it('should get current user with auth token', async () => {
      localStorage.setItem('token', 'jwt_token');

      const mockResponse = {
        success: true,
        user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.getCurrentUser();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token',
        },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Athlete endpoints', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'jwt_token');
    });

    it('should get all athletes', async () => {
      const mockResponse = {
        success: true,
        athletes: [
          { id: 'athlete-1', name: 'John Doe' },
          { id: 'athlete-2', name: 'Jane Smith' },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.getAthletes();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/athletes`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get athlete by id', async () => {
      const mockResponse = {
        success: true,
        athlete: { id: 'athlete-1', name: 'John Doe' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.getAthlete('athlete-1');

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/athletes/athlete-1`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create athlete', async () => {
      const athleteData = {
        name: 'New Athlete',
        date_of_birth: '2000-01-01',
        gender: 'male',
        skill_level: 'intermediate',
        dominant_hand: 'right',
      };

      const mockResponse = {
        success: true,
        athlete: { id: 'athlete-3', ...athleteData },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.createAthlete(athleteData);

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/athletes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token',
        },
        body: JSON.stringify(athleteData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should update athlete', async () => {
      const updateData = { name: 'Updated Name' };

      const mockResponse = {
        success: true,
        athlete: { id: 'athlete-1', name: 'Updated Name' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.updateAthlete('athlete-1', updateData);

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/athletes/athlete-1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token',
        },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should delete athlete', async () => {
      const mockResponse = { success: true };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.deleteAthlete('athlete-1');

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/athletes/athlete-1`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token',
        },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Session endpoints', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'jwt_token');
    });

    it('should start session', async () => {
      const mockResponse = {
        success: true,
        session: {
          id: 'session-1',
          athlete_id: 'athlete-1',
          coach_id: 'coach-1',
          start_time: new Date().toISOString(),
          status: 'active',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.startSession({
        athleteId: 'athlete-1',
        targetZone: 'forehand',
      });

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token',
        },
        body: JSON.stringify({
          athleteId: 'athlete-1',
          targetZone: 'forehand',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should stop session with notes and rating', async () => {
      const mockResponse = { success: true };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.stopSession('session-1', {
        sessionNotes: 'Great session',
        sessionRating: 5,
      });

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/sessions/session-1/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token',
        },
        body: JSON.stringify({
          sessionNotes: 'Great session',
          sessionRating: 5,
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get sessions with pagination', async () => {
      const mockResponse = {
        success: true,
        sessions: [
          { id: 'session-1', athlete_id: 'athlete-1' },
          { id: 'session-2', athlete_id: 'athlete-2' },
        ],
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.getSessions({ limit: 10, offset: 0 });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/sessions?limit=10&offset=0`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer jwt_token',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get session by id', async () => {
      const mockResponse = {
        success: true,
        session: {
          id: 'session-1',
          athlete_id: 'athlete-1',
          shots: [{ id: 'shot-1' }, { id: 'shot-2' }],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.getSession('session-1');

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/sessions/session-1`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token',
        },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Template endpoints', () => {
    it('should get all templates without auth', async () => {
      const mockResponse = {
        success: true,
        templates: [
          {
            id: 'template-001',
            name: 'template-001',
            description: 'first template',
            positions: [
              { positionIndex: 0, box: { x1: 46, y1: 594, x2: 122, y2: 670 }, dot: { x: 46, y: 670 } },
              { positionIndex: 1, box: { x1: 488, y1: 198, x2: 564, y2: 274 }, dot: { x: 526, y: 236 } },
              { positionIndex: 2, box: { x1: 488, y1: 0, x2: 564, y2: 76 }, dot: { x: 526, y: 38 } },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.getTemplates();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/templates`, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockResponse);
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].positions).toHaveLength(3);
    });

    it('should get template by id without auth', async () => {
      const mockResponse = {
        success: true,
        template: {
          id: 'template-001',
          name: 'template-001',
          description: 'first template',
          positions: [
            { positionIndex: 0, box: { x1: 46, y1: 594, x2: 122, y2: 670 }, dot: { x: 46, y: 670 } },
            { positionIndex: 1, box: { x1: 488, y1: 198, x2: 564, y2: 274 }, dot: { x: 526, y: 236 } },
            { positionIndex: 2, box: { x1: 488, y1: 0, x2: 564, y2: 76 }, dot: { x: 526, y: 38 } },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.getTemplate('template-001');

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/templates/template-001`, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockResponse);
      expect(result.template.id).toBe('template-001');
    });

    it('should not include auth token for template requests', async () => {
      // Even with token set, templates should not send auth
      localStorage.setItem('token', 'jwt_token');

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ success: true, templates: [] }),
      });

      await api.getTemplates();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/templates`, {
        headers: { 'Content-Type': 'application/json' },
      });
      // Verify no Authorization header was sent
      const calledHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(calledHeaders).not.toHaveProperty('Authorization');
    });

    it('should start session with templateId', async () => {
      localStorage.setItem('token', 'jwt_token');

      const mockResponse = {
        success: true,
        session: {
          id: 'session-1',
          athlete_id: 'athlete-1',
          template_id: 'template-001',
          status: 'active',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse,
      });

      const result = await api.startSession({
        athleteId: 'athlete-1',
        templateId: 'template-001',
      });

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token',
        },
        body: JSON.stringify({
          athleteId: 'athlete-1',
          templateId: 'template-001',
        }),
      });
      expect(result.session.template_id).toBe('template-001');
    });
  });

  describe('Authorization headers', () => {
    it('should not include Authorization header when no token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ success: true }),
      });

      await api.getCurrentUser();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('token', 'jwt_token_12345');

      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ success: true }),
      });

      await api.getCurrentUser();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt_token_12345',
        },
      });
    });
  });
});

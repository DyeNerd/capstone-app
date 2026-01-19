import axios, { AxiosInstance } from 'axios';

interface Athlete {
  id?: string;
  athlete_name: string;
  date_of_birth: string;
  gender: string;
  skill_level: string;
  dominant_hand: string;
}

interface Session {
  id: string;
  athleteId: string;
  coachId: string;
  startTime: string;
  endTime?: string;
  totalShots: number;
  avgAccuracy: number;
}

export class APIHelper {
  private apiClient: AxiosInstance;

  constructor(apiUrl: string, authToken?: string) {
    this.apiClient = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      timeout: 10000,
    });
  }

  /**
   * Set or update the authorization token
   */
  setAuthToken(token: string): void {
    this.apiClient.defaults.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Create a new athlete
   */
  async createAthlete(athleteData: Athlete): Promise<Athlete> {
    try {
      const response = await this.apiClient.post<{ success: boolean; athlete: Athlete }>('/athletes', athleteData);
      console.log(`✓ Created athlete: ${athleteData.athlete_name} (ID: ${response.data.athlete.id})`);
      return response.data.athlete;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to create athlete:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Get athlete by ID
   */
  async getAthlete(athleteId: string): Promise<Athlete> {
    try {
      const response = await this.apiClient.get<Athlete>(`/athletes/${athleteId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to get athlete:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Get all athletes
   */
  async getAllAthletes(): Promise<Athlete[]> {
    try {
      const response = await this.apiClient.get<Athlete[]>('/athletes');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to get athletes:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Delete an athlete
   */
  async deleteAthlete(athleteId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/athletes/${athleteId}`);
      console.log(`✓ Deleted athlete: ${athleteId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to delete athlete:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Start a training session
   */
  async startSession(athleteId: string, targetZone?: string): Promise<Session> {
    try {
      const response = await this.apiClient.post<{ success: boolean; session: Session }>(
        '/sessions/start',
        { athleteId, targetZone }
      );
      console.log(`✓ Started session: ${response.data.session.id}`);
      return response.data.session;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to start session:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Stop a training session
   */
  async stopSession(
    sessionId: string,
    sessionNotes?: string,
    sessionRating?: number
  ): Promise<Session> {
    try {
      const response = await this.apiClient.post<{ success: boolean; session: Session }>(
        `/sessions/${sessionId}/stop`,
        { sessionNotes, sessionRating }
      );
      console.log(`✓ Stopped session: ${sessionId}`);
      return response.data.session;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to stop session:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session> {
    try {
      const response = await this.apiClient.get<{ success: boolean; session: Session }>(`/sessions/${sessionId}`);
      return response.data.session;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to get session:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Get all sessions
   */
  async getAllSessions(limit = 10, offset = 0): Promise<Session[]> {
    try {
      const response = await this.apiClient.get<Session[]>(
        `/sessions?limit=${limit}&offset=${offset}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to get sessions:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/sessions/${sessionId}`);
      console.log(`✓ Deleted session: ${sessionId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to delete session:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  /**
   * Delete all sessions for a specific athlete
   */
  async deleteAthleteSessionsBulk(athleteId: string): Promise<void> {
    try {
      // Get all sessions for the athlete
      const response = await this.apiClient.get(`/sessions?limit=100&offset=0`);

      // Response format: { success: true, sessions: [], total: X, ... }
      const sessionsData = response.data.sessions || response.data.data || response.data;

      // Handle both array and object responses
      const sessions = Array.isArray(sessionsData) ? sessionsData : [];

      const athleteSessions = sessions.filter(
        (session: Session) => session.athleteId === athleteId || (session as any).athlete_id === athleteId
      );

      // Delete each session
      for (const session of athleteSessions) {
        await this.deleteSession(session.id);
      }

      console.log(
        `✓ Deleted ${athleteSessions.length} sessions for athlete ${athleteId}`
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Failed to delete athlete sessions:',
          error.response?.data || error.message
        );
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiClient.defaults.baseURL?.replace('/api', '')}/health`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

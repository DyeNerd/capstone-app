import { AppDataSource } from '../config/database';
import { TrainingSession } from '../models/TrainingSession';
import { SessionStatus } from '../types';

interface CreateSessionData {
  athleteId: string;
  coachId: string;
  startTime: Date;
  status: SessionStatus;
  targetZone?: string;
}

interface StopSessionData {
  endTime: Date;
  status: SessionStatus;
  sessionNotes?: string;
  sessionRating?: number;
}

interface SessionListFilters {
  athleteId?: string;
  status?: SessionStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface SessionStats {
  totalShots: number;
  successfulShots: number;
  averageAccuracy: number;
  averageVelocity: number;
}

class SessionService {
  private sessionRepository = AppDataSource.getRepository(TrainingSession);

  async createSession(data: CreateSessionData): Promise<TrainingSession> {
    const session = this.sessionRepository.create({
      athlete: { id: data.athleteId },
      coach: { id: data.coachId },
      start_time: data.startTime,
      status: data.status,
      target_zone: data.targetZone,
    });

    return await this.sessionRepository.save(session);
  }

  async getSessionById(
    id: string,
    includeRelations: string[] = []
  ): Promise<TrainingSession> {
    // Default to NOT loading shots unless explicitly requested
    // This prevents unnecessary data transfer for non-stats operations
    const relations = includeRelations.length > 0
      ? includeRelations
      : ['athlete', 'coach'];

    const session = await this.sessionRepository.findOne({
      where: { id },
      relations,
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  async listSessions(filters: SessionListFilters = {}) {
    const { athleteId, status, startDate, endDate, page = 1, limit = 20 } = filters;

    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.athlete', 'athlete')
      .leftJoinAndSelect('session.coach', 'coach');

    if (athleteId) {
      queryBuilder.andWhere('session.athlete_id = :athleteId', { athleteId });
    }

    if (status) {
      queryBuilder.andWhere('session.status = :status', { status });
    }

    if (startDate) {
      queryBuilder.andWhere('session.start_time >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('session.start_time <= :endDate', { endDate });
    }

    queryBuilder
      .orderBy('session.start_time', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [sessions, total] = await queryBuilder.getManyAndCount();

    return {
      sessions,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async stopSession(id: string, data: StopSessionData): Promise<TrainingSession> {
    // Don't load shots relation - we don't need it for stopping
    const session = await this.getSessionById(id, []);

    session.end_time = data.endTime;
    session.status = data.status;
    session.session_notes = data.sessionNotes;
    session.session_rating = data.sessionRating;

    return await this.sessionRepository.save(session);
  }

  /**
   * REFACTORED: Single-pass statistics calculation
   *
   * Performance improvement: O(4n) → O(n)
   * - Old: 4 separate array passes (filter + 3 reduces)
   * - New: 1 single reduce with accumulator object
   *
   * For 100 shots: 400 iterations → 100 iterations (75% reduction)
   */
  async updateSessionStats(sessionId: string): Promise<TrainingSession> {
    const session = await this.getSessionById(sessionId, ['shots']);

    if (!session.shots || session.shots.length === 0) {
      // Reset stats to zero when no shots
      session.total_shots = 0;
      session.successful_shots = 0;
      session.average_accuracy_percent = 0;
      session.average_shot_velocity_kmh = 0;
      return session;
    }

    // OPTIMIZATION: Single-pass calculation using accumulator pattern
    const stats = session.shots.reduce<SessionStats>(
      (acc, shot) => {
        acc.totalShots++;

        if (shot.was_successful) {
          acc.successfulShots++;
        }

        // Convert Decimal to number once per shot (not per reduce)
        acc.averageAccuracy += Number(shot.accuracy_percent || 0);
        acc.averageVelocity += Number(shot.velocity_kmh || 0);

        return acc;
      },
      { totalShots: 0, successfulShots: 0, averageAccuracy: 0, averageVelocity: 0 }
    );

    // Calculate averages (single division at end, not in loop)
    const totalShots = stats.totalShots;
    session.total_shots = totalShots;
    session.successful_shots = stats.successfulShots;
    session.average_accuracy_percent = stats.averageAccuracy / totalShots;
    session.average_shot_velocity_kmh = stats.averageVelocity / totalShots;

    return await this.sessionRepository.save(session);
  }

  /**
   * NEW: Incremental stats update for real-time shot processing
   * This avoids recalculating from scratch on every shot
   *
   * Performance: O(1) constant time vs O(n) full recalc
   *
   * Formula for running average:
   *   new_avg = (old_avg * old_count + new_value) / new_count
   */
  async incrementalUpdateStats(
    sessionId: string,
    newShotAccuracy: number,
    newShotVelocity: number,
    wasSuccessful: boolean
  ): Promise<TrainingSession> {
    // Fetch session WITHOUT shots relation for performance
    const session = await this.getSessionById(sessionId, []);

    const oldTotal = session.total_shots || 0;
    const newTotal = oldTotal + 1;

    // Update running averages using mathematical formula
    const oldAvgAccuracy = Number(session.average_accuracy_percent || 0);
    const oldAvgVelocity = Number(session.average_shot_velocity_kmh || 0);

    session.total_shots = newTotal;
    session.successful_shots = (session.successful_shots || 0) + (wasSuccessful ? 1 : 0);

    // Running average: new_avg = (old_avg * old_count + new_value) / new_count
    session.average_accuracy_percent =
      (oldAvgAccuracy * oldTotal + newShotAccuracy) / newTotal;

    session.average_shot_velocity_kmh =
      (oldAvgVelocity * oldTotal + newShotVelocity) / newTotal;

    return await this.sessionRepository.save(session);
  }

  async deleteSession(id: string): Promise<{ success: boolean }> {
    const result = await this.sessionRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Session not found');
    }
    return { success: true };
  }
}

export const sessionService = new SessionService();

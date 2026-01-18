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

interface SessionStats {
  totalShots: number;
  successfulShots: number;
  averageAccuracy: number;
  averageVelocity: number;
}

class SessionService {
  private sessionRepository = AppDataSource.getRepository(TrainingSession);

  async createSession(data: CreateSessionData) {
    const session = this.sessionRepository.create({
      athlete: { id: data.athleteId } as any,
      coach: { id: data.coachId } as any,
      start_time: data.startTime,
      status: data.status,
      target_zone: data.targetZone,
    });

    return await this.sessionRepository.save(session);
  }

  async getSessionById(id: string, includeRelations: string[] = []) {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: includeRelations.length > 0 ? includeRelations : ['athlete', 'coach', 'shots'],
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  async listSessions(filters: any = {}) {
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

  async stopSession(id: string, data: StopSessionData) {
    const session = await this.getSessionById(id);

    session.end_time = data.endTime;
    session.status = data.status;
    session.session_notes = data.sessionNotes;
    session.session_rating = data.sessionRating;

    return await this.sessionRepository.save(session);
  }

  async updateSessionStats(sessionId: string) {
    const session = await this.getSessionById(sessionId, ['shots']);

    if (!session.shots || session.shots.length === 0) {
      return session;
    }

    // OPTIMIZATION: Single-pass calculation using accumulator pattern
    const stats = session.shots.reduce<SessionStats>(
      (acc, shot) => {
        acc.totalShots++;
        if (shot.was_successful) {
          acc.successfulShots++;
        }
        acc.averageAccuracy += Number(shot.accuracy_percent || 0);
        acc.averageVelocity += Number(shot.velocity_kmh || 0);
        return acc;
      },
      { totalShots: 0, successfulShots: 0, averageAccuracy: 0, averageVelocity: 0 }
    );

    const totalShots = stats.totalShots;
    session.total_shots = totalShots;
    session.successful_shots = stats.successfulShots;
    session.average_accuracy_percent = stats.averageAccuracy / totalShots;
    session.average_shot_velocity_kmh = stats.averageVelocity / totalShots;

    return await this.sessionRepository.save(session);
  }

  /**
   * NEW: Incremental stats update for real-time shot processing
   * Performance: O(1) constant time vs O(n) full recalc
   * Uses running average formula: new_avg = (old_avg * old_count + new_value) / new_count
   */
  async incrementalUpdateStats(
    sessionId: string,
    newShotAccuracy: number,
    newShotVelocity: number,
    wasSuccessful: boolean
  ): Promise<TrainingSession> {
    const session = await this.getSessionById(sessionId, []); // No relations needed

    const oldTotal = session.total_shots || 0;
    const newTotal = oldTotal + 1;

    const oldAvgAccuracy = Number(session.average_accuracy_percent || 0);
    const oldAvgVelocity = Number(session.average_shot_velocity_kmh || 0);

    session.total_shots = newTotal;
    session.successful_shots = (session.successful_shots || 0) + (wasSuccessful ? 1 : 0);

    // Running average: new_avg = (old_avg * old_count + new_value) / new_count
    session.average_accuracy_percent = (oldAvgAccuracy * oldTotal + newShotAccuracy) / newTotal;
    session.average_shot_velocity_kmh = (oldAvgVelocity * oldTotal + newShotVelocity) / newTotal;

    return await this.sessionRepository.save(session);
  }

  async deleteSession(id: string) {
    const result = await this.sessionRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Session not found');
    }
    return { success: true };
  }
}

export const sessionService = new SessionService();


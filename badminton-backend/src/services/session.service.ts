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

    // Calculate statistics (convert Decimal types to numbers)
    const totalShots = session.shots.length;
    const successfulShots = session.shots.filter((s) => s.was_successful).length;
    
    // Convert accuracy_percent and velocity_kmh to numbers before summing
    const avgAccuracy =
      session.shots.reduce((sum, s) => sum + Number(s.accuracy_percent || 0), 0) / totalShots;
    const avgVelocity =
      session.shots.reduce((sum, s) => sum + Number(s.velocity_kmh || 0), 0) / totalShots;

    session.total_shots = totalShots;
    session.successful_shots = successfulShots;
    session.average_accuracy_percent = avgAccuracy;
    session.average_shot_velocity_kmh = avgVelocity;

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


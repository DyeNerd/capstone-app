import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Shot } from '../models/Shot';
import { CourtZone } from '../types';

interface CreateShotData {
  sessionId: string;
  shotNumber: number;
  timestamp: Date;
  landingPositionX: number;
  landingPositionY: number;
  targetPositionX: number;
  targetPositionY: number;
  accuracyCm: number;
  accuracyPercent: number;
  velocityKmh?: number;
  detectionConfidence?: number;
  wasSuccessful: boolean;
  courtZone: CourtZone;
  inBox?: boolean; // Was landing inside target box?
  targetPositionIndex?: number; // Which position in cycle (0, 1, 2...)
  score?: number; // Shot score (0-100)
}

class ShotService {
  private _shotRepository?: Repository<Shot>;

  private get shotRepository(): Repository<Shot> {
    if (!this._shotRepository) {
      this._shotRepository = AppDataSource.getRepository(Shot);
    }
    return this._shotRepository;
  }

  async createShot(data: CreateShotData) {
    const shot = this.shotRepository.create({
      session: { id: data.sessionId } as { id: string },
      shot_number: data.shotNumber,
      timestamp: data.timestamp,
      landing_position_x: data.landingPositionX,
      landing_position_y: data.landingPositionY,
      target_position_x: data.targetPositionX,
      target_position_y: data.targetPositionY,
      accuracy_cm: data.accuracyCm,
      accuracy_percent: data.accuracyPercent,
      velocity_kmh: data.velocityKmh,
      detection_confidence: data.detectionConfidence,
      was_successful: data.wasSuccessful,
      court_zone: data.courtZone,
      in_box: data.inBox,
      target_position_index: data.targetPositionIndex,
      score: data.score,
    });

    return await this.shotRepository.save(shot);
  }

  async getShotsBySessionId(sessionId: string) {
    return await this.shotRepository.find({
      where: { session: { id: sessionId } },
      order: { shot_number: 'ASC' },
    });
  }

  async getShotById(id: string) {
    const shot = await this.shotRepository.findOne({ where: { id } });
    if (!shot) {
      throw new Error('Shot not found');
    }
    return shot;
  }
}

export const shotService = new ShotService();


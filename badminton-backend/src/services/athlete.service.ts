import { AppDataSource } from '../config/database';
import { Athlete } from '../models/Athlete';
import { SkillLevel, DominantHand } from '../types';

interface CreateAthleteData {
  athlete_name: string;
  date_of_birth?: Date;
  gender?: string;
  skill_level: SkillLevel;
  height_cm?: number;
  dominant_hand?: DominantHand;
  coach_id: string;
  profile_image_url?: string;
  notes?: string;
}

class AthleteService {
  private athleteRepository = AppDataSource.getRepository(Athlete);

  async createAthlete(data: CreateAthleteData) {
    const athlete = this.athleteRepository.create({
      ...data,
      coach: { id: data.coach_id } as any,
    });

    return await this.athleteRepository.save(athlete);
  }

  async getAthleteById(id: string) {
    const athlete = await this.athleteRepository.findOne({
      where: { id },
      relations: ['coach'],
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    return athlete;
  }

  async listAthletes(coachId?: string) {
    const where = coachId ? { coach: { id: coachId } } : {};
    return await this.athleteRepository.find({
      where,
      relations: ['coach'],
      order: { created_at: 'DESC' },
    });
  }

  async updateAthlete(id: string, data: Partial<CreateAthleteData>) {
    const athlete = await this.getAthleteById(id);
    Object.assign(athlete, data);
    return await this.athleteRepository.save(athlete);
  }

  async deleteAthlete(id: string) {
    const result = await this.athleteRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Athlete not found');
    }
    return { success: true };
  }
}

export const athleteService = new AthleteService();


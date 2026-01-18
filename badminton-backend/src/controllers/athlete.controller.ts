import { Response } from 'express';
import { athleteService } from '../services/athlete.service';
import { AuthRequest } from '../types';

export class AthleteController {
  async createAthlete(req: AuthRequest, res: Response) {
    try {
      const athleteData = {
        ...req.body,
        coach_id: req.user!.id,
      };

      const athlete = await athleteService.createAthlete(athleteData);

      res.status(201).json({ success: true, athlete });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAthlete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const athlete = await athleteService.getAthleteById(id);

      res.status(200).json({ success: true, athlete });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async listAthletes(req: AuthRequest, res: Response) {
    try {
      const athletes = await athleteService.listAthletes(req.user!.id);

      res.status(200).json({ success: true, athletes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateAthlete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const athlete = await athleteService.updateAthlete(id, req.body);

      res.status(200).json({ success: true, athlete });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAthlete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await athleteService.deleteAthlete(id);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}

export const athleteController = new AthleteController();


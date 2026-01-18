import { Router } from 'express';
import { athleteController } from '../controllers/athlete.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All athlete routes require authentication
router.use(authenticate);

router.get('/', athleteController.listAthletes.bind(athleteController));
router.get('/:id', athleteController.getAthlete.bind(athleteController));
router.post('/', athleteController.createAthlete.bind(athleteController));
router.put('/:id', athleteController.updateAthlete.bind(athleteController));
router.delete('/:id', athleteController.deleteAthlete.bind(athleteController));

export default router;


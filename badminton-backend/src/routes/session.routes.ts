import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All session routes require authentication
router.use(authenticate);

router.post('/start', sessionController.startSession.bind(sessionController));
router.post('/:sessionId/stop', sessionController.stopSession.bind(sessionController));
router.get('/', sessionController.listSessions.bind(sessionController));
router.get('/:sessionId', sessionController.getSession.bind(sessionController));

export default router;


import { Router } from 'express';
import {
  logProctorEvent,
  getSessionProctorEvents,
  getLiveExamMonitoring,
} from '../controllers/proctorController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.post('/log-event', authenticate, logProctorEvent);
router.get('/session/:sessionId', authenticate, getSessionProctorEvents);
router.get('/live/:examId', authenticate, requireRole(['FACULTY', 'ADMIN']), getLiveExamMonitoring);

export default router;

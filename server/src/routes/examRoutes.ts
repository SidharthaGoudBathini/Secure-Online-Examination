import { Router } from 'express';
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  publishExam,
  getExamPreview,
  getStudentDashboardStats,
  getFacultyDashboardStats,
} from '../controllers/examController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getExams);
router.get('/student/dashboard-stats', authenticate, requireRole(['STUDENT']), getStudentDashboardStats);
router.get('/faculty/dashboard-stats', authenticate, requireRole(['FACULTY', 'ADMIN']), getFacultyDashboardStats);
router.get('/:id', authenticate, getExamById);
router.get('/:id/preview', authenticate, requireRole(['FACULTY', 'ADMIN']), getExamPreview);

router.post('/', authenticate, requireRole(['FACULTY', 'ADMIN']), createExam);
router.put('/:id', authenticate, requireRole(['FACULTY', 'ADMIN']), updateExam);
router.delete('/:id', authenticate, requireRole(['FACULTY', 'ADMIN']), deleteExam);
router.post('/:id/publish', authenticate, requireRole(['FACULTY', 'ADMIN']), publishExam);

export default router;

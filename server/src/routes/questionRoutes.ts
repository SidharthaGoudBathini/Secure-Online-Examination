import { Router } from 'express';
import {
  getQuestionsByExam,
  getQuestionBank,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/exam/:examId', authenticate, requireRole(['FACULTY', 'ADMIN']), getQuestionsByExam);
router.get('/bank', authenticate, requireRole(['FACULTY', 'ADMIN']), getQuestionBank);
router.post('/', authenticate, requireRole(['FACULTY', 'ADMIN']), createQuestion);
router.put('/:id', authenticate, requireRole(['FACULTY', 'ADMIN']), updateQuestion);
router.delete('/:id', authenticate, requireRole(['FACULTY', 'ADMIN']), deleteQuestion);

export default router;

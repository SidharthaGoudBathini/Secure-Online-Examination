import { Router } from 'express';
import {
  startExam,
  saveAnswer,
  submitExam,
  getExamResult,
  getExamSubmissions,
  gradeSubjectiveResponse,
} from '../controllers/submissionController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Student exam taking flow
router.post('/start/:examId', authenticate, startExam);
router.post('/session/:sessionId/save-answer', authenticate, saveAnswer);
router.post('/session/:sessionId/submit', authenticate, submitExam);
router.get('/session/:sessionId/result', authenticate, getExamResult);

// Faculty / Admin grading and review
router.get('/exam/:examId/submissions', authenticate, requireRole(['FACULTY', 'ADMIN']), getExamSubmissions);
router.post('/session/:sessionId/question/:questionId/grade', authenticate, requireRole(['FACULTY', 'ADMIN']), gradeSubjectiveResponse);

export default router;

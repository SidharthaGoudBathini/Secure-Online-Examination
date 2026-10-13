import { Router } from 'express';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/courseController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Courses
router.get('/', authenticate, getCourses);
router.post('/', authenticate, requireRole(['ADMIN']), createCourse);
router.put('/:id', authenticate, requireRole(['ADMIN']), updateCourse);
router.delete('/:id', authenticate, requireRole(['ADMIN']), deleteCourse);

// Subjects
router.get('/subjects', authenticate, getSubjects);
router.post('/subjects', authenticate, requireRole(['ADMIN', 'FACULTY']), createSubject);
router.put('/subjects/:id', authenticate, requireRole(['ADMIN', 'FACULTY']), updateSubject);
router.delete('/subjects/:id', authenticate, requireRole(['ADMIN']), deleteSubject);

export default router;

import { Router } from 'express';
import {
  getUsers,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
} from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, requireRole(['ADMIN', 'FACULTY']), getUsers);
router.post('/', authenticate, requireRole(['ADMIN']), createUserByAdmin);
router.put('/:id', authenticate, requireRole(['ADMIN']), updateUserByAdmin);
router.delete('/:id', authenticate, requireRole(['ADMIN']), deleteUserByAdmin);

export default router;

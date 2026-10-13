import { Router } from 'express';
import {
  getAdminAnalytics,
  getAuditLogs,
  getGlobalSecuritySettings,
  updateGlobalSecuritySetting,
  getComprehensiveReports,
  exportResultsCsv,
} from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Only ADMIN can access administrator analytics and settings
router.get('/analytics', authenticate, requireRole(['ADMIN']), getAdminAnalytics);
router.get('/audit-logs', authenticate, requireRole(['ADMIN']), getAuditLogs);
router.get('/security-settings', authenticate, requireRole(['ADMIN']), getGlobalSecuritySettings);
router.put('/security-settings', authenticate, requireRole(['ADMIN']), updateGlobalSecuritySetting);

// Reports and CSV export available to Faculty and Admin
router.get('/reports', authenticate, requireRole(['FACULTY', 'ADMIN']), getComprehensiveReports);
router.get('/export-csv', authenticate, requireRole(['FACULTY', 'ADMIN']), exportResultsCsv);

export default router;

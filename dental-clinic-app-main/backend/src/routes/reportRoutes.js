import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Only admins can see detailed reports
router.get('/', authorize(['admin']), reportController.getReportData);

export default router;

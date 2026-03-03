import { Router } from 'express';
import * as statsController from '../controllers/statsController.js';

const router = Router();

// GET /api/stats
router.get('/', statsController.getStats);

export default router;

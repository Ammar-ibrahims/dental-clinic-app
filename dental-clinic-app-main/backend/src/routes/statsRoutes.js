import { Router } from 'express';
import * as statsController from '../controllers/statsController.js';

const router = Router();

// This links the URL /api/stats to the function in your controller
router.get('/', statsController.getStats);

export default router;
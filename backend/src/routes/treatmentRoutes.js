import { Router } from 'express';
import * as treatmentController from '../controllers/treatmentController.js';

const router = Router();

// GET /api/treatments
router.get('/', treatmentController.getAll);

export default router;

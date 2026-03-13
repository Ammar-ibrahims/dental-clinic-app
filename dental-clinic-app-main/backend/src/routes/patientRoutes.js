import { Router } from 'express';
import * as patientController from '../controllers/patientController.js';
import { upload } from '../services/uploadService.js';
import { authorize } from '../middleware/authMiddleware.js';
const router = Router();

// Use the controller functions for each route
router.get('/me', authorize(['patient', 'admin']), patientController.getMyProfile);
router.get('/', patientController.getAll);
router.get('/:id', patientController.getById);
router.post('/', upload.single('patient_file'), patientController.create);
router.put('/:id', upload.single('patient_file'), patientController.update);
router.delete('/:id', patientController.remove);



export default router;
import { Router } from 'express';
import * as patientController from '../controllers/patientController.js';
import { upload } from '../services/uploadService.js';
import { authorize } from '../middleware/authMiddleware.js';
const router = Router();

// Use the controller functions for each route
router.get('/me', authorize(['patient', 'admin']), patientController.getMyProfile);
router.get('/', authorize(['admin']), patientController.getAll);
router.get('/:id', authorize(['admin', 'patient']), patientController.getById);
router.post('/', authorize(['admin']), upload.single('patient_file'), patientController.create);
router.put('/:id', authorize(['admin', 'patient']), upload.single('patient_file'), patientController.update);
router.delete('/:id', authorize(['admin']), patientController.remove);



export default router;
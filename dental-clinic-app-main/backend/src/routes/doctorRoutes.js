import { Router } from 'express';
import * as doctorController from '../controllers/doctorController.js';
import { validateRequired, validateIdParam } from '../middleware/validate.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Validation rules for creating / updating a doctor
const doctorFields = [
    { field: 'name', message: 'Doctor name is required' },
    { field: 'specialty', message: 'Specialty is required' },
    { field: 'email', message: 'Email is required' },
];

// GET   /api/doctors
router.get('/', doctorController.getAll);

// GET   /api/doctors/:id
router.get('/:id', validateIdParam, doctorController.getById);

// POST  /api/doctors
router.post('/', authorize(['admin']), validateRequired(doctorFields), doctorController.create);

// PUT   /api/doctors/:id
router.put('/:id', authorize(['admin']), validateIdParam, validateRequired(doctorFields), doctorController.update);

// DELETE /api/doctors/:id  (soft delete)
router.delete('/:id', authorize(['admin']), validateIdParam, doctorController.remove);

export default router;

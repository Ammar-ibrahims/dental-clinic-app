import { Router } from 'express';
import * as doctorController from '../controllers/doctorController.js';
import { validateRequired, validateIdParam } from '../middleware/validate.js';

const router = Router();

// Validation rules for creating / updating a dentist
const doctorFields = [
    { field: 'name', message: 'Doctor name is required' },
    { field: 'specialty', message: 'Specialty is required' },
    { field: 'email', message: 'Email is required' },
];

// GET   /api/dentists
router.get('/', doctorController.getAll);

// GET   /api/dentists/:id
router.get('/:id', validateIdParam, doctorController.getById);

// POST  /api/dentists
router.post('/', validateRequired(doctorFields), doctorController.create);

// PUT   /api/dentists/:id
router.put('/:id', validateIdParam, validateRequired(doctorFields), doctorController.update);

// DELETE /api/dentists/:id  (soft delete)
router.delete('/:id', validateIdParam, doctorController.remove);

export default router;

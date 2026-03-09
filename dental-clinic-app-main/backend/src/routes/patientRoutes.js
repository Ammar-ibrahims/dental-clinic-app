import { Router } from 'express';
import * as patientController from '../controllers/patientController.js';
import { validateRequired, validateIdParam } from '../middleware/validate.js';

const router = Router();

// Validation rules for creating / updating a patient
const patientFields = [
    { field: 'name', message: 'Patient name is required' },
    { field: 'email', message: 'Email is required' },
    { field: 'phone', message: 'Phone number is required' },
];

// GET   /api/patients
router.get('/', patientController.getAll);

// GET   /api/patients/:id
router.get('/:id', validateIdParam, patientController.getById);

// POST  /api/patients
router.post('/', validateRequired(patientFields), patientController.create);

// PUT   /api/patients/:id
router.put('/:id', validateIdParam, validateRequired(patientFields), patientController.update);

// DELETE /api/patients/:id
router.delete('/:id', validateIdParam, patientController.remove);

export default router;

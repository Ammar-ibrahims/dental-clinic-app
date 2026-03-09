import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { validateRequired, validateIdParam } from '../middleware/validate.js';

const router = Router();

// Validation rules for creating an appointment
const appointmentFields = [
    { field: 'patient_id', message: 'Patient ID is required' },
    { field: 'dentist_id', message: 'Dentist ID is required' },
    { field: 'appointment_date', message: 'Appointment date is required' },
    { field: 'appointment_time', message: 'Appointment time is required' },
];

// GET   /api/appointments/slots?dentist_id=X&date=YYYY-MM-DD
// ⚠️  This MUST come before /:id so "slots" isn't matched as an id param
router.get('/slots', appointmentController.getAvailableSlots);

// GET   /api/appointments
router.get('/', appointmentController.getAll);

// GET   /api/appointments/:id
router.get('/:id', validateIdParam, appointmentController.getById);

// POST  /api/appointments  (with conflict check)
router.post('/', validateRequired(appointmentFields), appointmentController.create);

// PATCH /api/appointments/:id/status
router.patch(
    '/:id/status',
    validateIdParam,
    validateRequired([{ field: 'status', message: 'Status is required' }]),
    appointmentController.updateStatus
);

// DELETE /api/appointments/:id
router.delete('/:id', validateIdParam, appointmentController.remove);

export default router;

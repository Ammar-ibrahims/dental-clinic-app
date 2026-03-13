import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { validateRequired, validateIdParam } from '../middleware/validate.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Validation rules for creating an appointment
const appointmentFields = [
    { field: 'patient_id', message: 'Patient ID is required' },
    { field: 'dentist_id', message: 'Dentist ID is required' },
    { field: 'appointment_date', message: 'Appointment date is required' },
    { field: 'appointment_time', message: 'Appointment time is required' },
];

// --- FIXED: Changed /slots to /available-slots to match Frontend ---
// This MUST stay above /:id
router.get('/available-slots', appointmentController.getAvailableSlots);

// GET   /api/appointments
router.get('/', appointmentController.getAll);

// GET   /api/appointments/:id
router.get('/:id', validateIdParam, appointmentController.getById);

router.get('/me', authorize(['patient']), appointmentController.getMyAppointments);

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

// This ensures only the logged-in patient can see their own appointments
router.get('/me', authorize(['patient']), appointmentController.getMyAppointments);
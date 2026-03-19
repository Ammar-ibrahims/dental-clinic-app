import { Router } from 'express';
import { sendAppointmentEmail } from '../services/mailerLiteService.js';

const router = Router();

// Route: POST /api/test/email
router.post('/email', async (req, res) => {
    const { email, name, date } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        await sendAppointmentEmail(email, name || 'Patient', date || 'Tomorrow');
        res.status(200).json({ message: 'Test email sent successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
});

export default router;
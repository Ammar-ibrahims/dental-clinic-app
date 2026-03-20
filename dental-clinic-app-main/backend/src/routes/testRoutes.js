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
    } catch (err) {
        console.error('Error sending test email:', err);
        res.status(500).json({ error: 'Failed to send test email', details: err.message });
    }
});

// Route: POST /api/test/db-patch
router.post('/db-patch', async (req, res) => {
    try {
        const result = await pool.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER');
        res.status(200).json({ message: 'Database patched: age column added to patients table', result });
    } catch (err) {
        res.status(500).json({ error: 'DB Patch failed', details: err.message });
    }
});

export default router;
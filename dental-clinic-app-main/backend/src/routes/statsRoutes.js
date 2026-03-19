import { Router } from 'express';
import pool from '../config/db.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = Router();

// This links the URL /api/stats to the function in your controller
router.get('/', authorize(['admin']), async (req, res) => {
    try {
        const patientsRes = await pool.query('SELECT COUNT(*) FROM patients');
        const doctorsRes = await pool.query('SELECT COUNT(*) FROM doctors');
        const apptsRes = await pool.query('SELECT COUNT(*) FROM appointments');
        const todayApptsRes = await pool.query('SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE');
        // The rest of the implementation for the stats route would go here
        // For example, to send the counts as a response:
        res.json({
            total_patients: patientsRes.rows[0].count,
            total_dentists: doctorsRes.rows[0].count,
            total_appointments: apptsRes.rows[0].count,
            todays_appointments: todayApptsRes.rows[0].count,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
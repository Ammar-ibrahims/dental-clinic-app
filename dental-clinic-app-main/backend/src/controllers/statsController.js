import pool from '../config/db.js';
import PatientMongo from '../models/Patient.js';
import mongoose from 'mongoose';

export const getStats = async (req, res) => {
    try {
        // FORCE THE SERVER TO BYPASS CACHE (Prevents 304 errors)
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        console.log("--- FETCHING FRESH STATS ---");

        const [patientResult, dentistResult, totalApptResult, todayApptResult] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM patients'),
            pool.query('SELECT COUNT(*) FROM dentists WHERE is_active = true'),
            pool.query("SELECT COUNT(*) FROM appointments WHERE status != 'Cancelled'"),
            // Using a simpler string-based date comparison to be safe
            pool.query(`
                SELECT COUNT(*) FROM appointments 
                WHERE TO_CHAR(appointment_date AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD') = 
                      TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD')
                AND status != 'Cancelled'
            `)
        ]);

        const stats = {
            total_patients: parseInt(patientResult.rows[0].count) || 0,
            total_dentists: parseInt(dentistResult.rows[0].count) || 0,
            total_appointments: parseInt(totalApptResult.rows[0].count) || 0,
            todays_appointments: parseInt(todayApptResult.rows[0].count) || 0,
        };

        console.log("FINAL STATS SENT TO FRONTEND:", stats);
        res.json(stats);

    } catch (err) {
        console.error("Dashboard Stats Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
import pool from '../config/db.js';

export const getStats = async (req, res) => {
    try {
        const [patients, dentists, appointments, todayAppts] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM patients'),
            pool.query('SELECT COUNT(*) FROM dentists WHERE is_active = true'),
            pool.query('SELECT COUNT(*) FROM appointments'),
            pool.query("SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE"),
        ]);
        res.json({
            total_patients: parseInt(patients.rows[0].count),
            total_dentists: parseInt(dentists.rows[0].count),
            total_appointments: parseInt(appointments.rows[0].count),
            todays_appointments: parseInt(todayAppts.rows[0].count),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

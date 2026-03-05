import pool from '../config/db.js';
import PatientMongo from '../models/Patient.js';
import mongoose from 'mongoose';

export const getStats = async (req, res) => {
    try {
        const [sqlPatients, dentists, appointments, todayAppts] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM patients'),
            pool.query('SELECT COUNT(*) FROM dentists WHERE is_active = true'),
            pool.query('SELECT COUNT(*) FROM appointments'),
            pool.query("SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE"),
        ]);

        let mongoCount = 0;
        if (mongoose.connection.readyState === 1) {
            mongoCount = await PatientMongo.countDocuments();
        }

        res.json({
            total_patients: parseInt(sqlPatients.rows[0].count) + mongoCount,
            total_dentists: parseInt(dentists.rows[0].count),
            total_appointments: parseInt(appointments.rows[0].count),
            todays_appointments: parseInt(todayAppts.rows[0].count),
            sql_patients: parseInt(sqlPatients.rows[0].count),
            mongo_patients: mongoCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

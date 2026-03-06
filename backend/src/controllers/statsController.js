import pool from '../config/db.js';
import PatientMongo from '../models/Patient.js';
import mongoose from 'mongoose';

// Helper for timeout
const withTimeout = (promise, ms, name) => {
    let timeoutFunc;
    const timeout = new Promise((_, reject) => {
        timeoutFunc = setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutFunc));
};

export const getStats = async (req, res) => {
    try {
        console.log('--- getStats Called ---');
        const stats = {
            total_patients: 0,
            total_dentists: 0,
            total_appointments: 0,
            todays_appointments: 0,
            sql_patients: 0,
            mongo_patients: 0
        };

        try {
            console.log('Running SQL queries...');
            const [sqlPatients, dentists, appointments, todayAppts] = await Promise.all([
                withTimeout(pool.query('SELECT COUNT(*) FROM patients'), 3000, 'SQL Patients').catch(e => ({ rows: [{ count: 0 }] })),
                withTimeout(pool.query('SELECT COUNT(*) FROM dentists WHERE is_active = true'), 3000, 'SQL Dentists').catch(e => ({ rows: [{ count: 0 }] })),
                withTimeout(pool.query('SELECT COUNT(*) FROM appointments'), 3000, 'SQL Appointments').catch(e => ({ rows: [{ count: 0 }] })),
                withTimeout(pool.query("SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE"), 3000, 'SQL Today Appts').catch(e => ({ rows: [{ count: 0 }] })),
            ]);

            stats.sql_patients = parseInt(sqlPatients.rows[0].count);
            stats.total_dentists = parseInt(dentists.rows[0].count);
            stats.total_appointments = parseInt(appointments.rows[0].count);
            stats.todays_appointments = parseInt(todayAppts.rows[0].count);
            console.log('SQL queries complete');
        } catch (sqlErr) {
            console.error('⚠️ SQL Stats Error:', sqlErr.message);
        }

        console.log('Checking Mongoose readiness:', mongoose.connection.readyState);
        if (mongoose.connection.readyState === 1) {
            try {
                console.log('Running Mongo query...');
                stats.mongo_patients = await withTimeout(PatientMongo.countDocuments(), 3000, 'MongoDB query');
                console.log('Mongo query complete');
            } catch (mongoErr) {
                console.error('⚠️ MongoDB Stats Error:', mongoErr.message);
            }
        }

        stats.total_patients = stats.sql_patients + stats.mongo_patients;
        console.log('Returning stats:', stats);
        res.json(stats);
    } catch (err) {
        console.error('❌ Critical Error in getStats:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

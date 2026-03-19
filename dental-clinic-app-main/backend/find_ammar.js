import 'dotenv/config';
import pool from './src/config/db.js';

async function diagnose() {
    try {
        console.log("--- Finding Ammar's Data ---");

        // Find users with name 'ammar'
        const users = await pool.query("SELECT * FROM users WHERE email ILIKE '%ammar%' OR role = 'patient'");
        console.table(users.rows);

        const patients = await pool.query("SELECT * FROM patients WHERE name ILIKE '%ammar%'");
        console.table(patients.rows);

        if (patients.rows.length > 0) {
            const pIds = patients.rows.map(p => p.id);
            const appts = await pool.query(`SELECT id, appointment_date, appointment_time, status, treatment_type FROM appointments WHERE patient_id = ANY($1)`, [pIds]);
            console.table(appts.rows);
        }

    } catch (err) {
        console.error("DIAGNOSE ERROR:", err);
    } finally {
        process.exit();
    }
}

diagnose();

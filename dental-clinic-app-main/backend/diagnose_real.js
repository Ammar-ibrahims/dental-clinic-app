import 'dotenv/config';
import pool from './src/config/db.js';

async function diagnose() {
    try {
        console.log("--- 🕵️ REAL DATABASE DIAGNOSTIC ---");
        console.log("Using Database URL:", process.env.DATABASE_URL.split('@')[1]); // Log host part only for safety

        // 1. Find the user 'ammar'
        const userRes = await pool.query("SELECT id, email, role FROM users WHERE email = 'ammar'");
        console.log("\nUsers found with email 'ammar':", JSON.stringify(userRes.rows, null, 2));

        if (userRes.rows.length === 0) {
            console.log("Trying to find any patient matching name 'ammar'...");
            const anyPatient = await pool.query("SELECT * FROM patients WHERE name ILIKE '%ammar%'");
            console.table(anyPatient.rows);
            return;
        }

        const userId = userRes.rows[0].id;

        // 2. Check for duplicate patient profiles
        const patientsRes = await pool.query("SELECT * FROM patients WHERE user_id = $1", [userId]);
        console.log(`\nPatient profiles for User ID ${userId}:`);
        console.table(patientsRes.rows);

        if (patientsRes.rows.length > 0) {
            const patientIds = patientsRes.rows.map(p => p.id);
            console.log(`\nChecking ALL appointments for these Patient IDs: ${patientIds.join(', ')}`);

            const apptRes = await pool.query(`
                SELECT a.id, a.patient_id, a.appointment_date, a.appointment_time, a.status, a.treatment_type, d.name as doctor_name
                FROM appointments a
                JOIN doctors d ON a.dentist_id = d.id
                WHERE a.patient_id = ANY($1)
                ORDER BY a.appointment_date DESC, a.appointment_time DESC
            `, [patientIds]);

            console.log("\nFound Appointments:");
            console.table(apptRes.rows);
        }

    } catch (err) {
        console.error("DIAGNOSE ERROR:", err);
    } finally {
        process.exit();
    }
}

diagnose();

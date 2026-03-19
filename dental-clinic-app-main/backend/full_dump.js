import 'dotenv/config';
import pool from './src/config/db.js';

async function dump() {
    try {
        console.log("--- 🕵️ Full DB Dump ---");
        const users = await pool.query("SELECT * FROM users");
        console.log("\nUSERS:");
        console.table(users.rows);

        const patients = await pool.query("SELECT * FROM patients");
        console.log("\nPATIENTS:");
        console.table(patients.rows);

        const appts = await pool.query("SELECT id, patient_id, appointment_date, appointment_time, status FROM appointments LIMIT 20");
        console.log("\nAPPOINTMENTS (first 20):");
        console.table(appts.rows);
    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        process.exit();
    }
}

dump();

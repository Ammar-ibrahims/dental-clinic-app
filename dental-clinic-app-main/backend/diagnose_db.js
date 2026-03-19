import pool from './src/config/db.js';

async function diagnose() {
    try {
        console.log("--- Comprehensive DB Peek ---");

        const users = await pool.query("SELECT id, email, role FROM users LIMIT 20");
        console.log("\nUsers (first 20):", JSON.stringify(users.rows, null, 2));

        const patients = await pool.query("SELECT id, name, user_id FROM patients LIMIT 20");
        console.log("\nPatients (first 20):", JSON.stringify(patients.rows, null, 2));

        const totalAppts = await pool.query("SELECT count(*) FROM appointments");
        console.log("\nTotal Appointments in DB:", totalAppts.rows[0].count);

    } catch (err) {
        console.error("DIAGNOSE ERROR:", err);
    } finally {
        process.exit();
    }
}

diagnose();

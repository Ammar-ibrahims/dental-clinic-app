import pool from './src/config/db.js';

async function dump() {
    try {
        console.log("--- 🕵️ Deep DB Dump ---");

        // 1. Get all patients to see if 'ammar' has duplicates
        const patients = await pool.query("SELECT * FROM patients");
        console.log("\nALL PATIENTS:");
        console.table(patients.rows);

        // 2. Get all appointments with their patient_id
        const appts = await pool.query(`
            SELECT a.id, a.patient_id, a.dentist_id, a.appointment_date, a.appointment_time, a.status, a.treatment_type, p.name as patient_name
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            ORDER BY a.id DESC
        `);
        console.log("\nALL APPOINTMENTS:");
        console.table(appts.rows);

        // 3. Check the count for each patient
        const counts = await pool.query("SELECT patient_id, count(*) FROM appointments GROUP BY patient_id");
        console.log("\nAPPOINTMENT COUNTS BY PATIENT_ID:");
        console.table(counts.rows);

    } catch (err) {
        console.error("DUMP ERROR:", err);
    } finally {
        process.exit();
    }
}

dump();

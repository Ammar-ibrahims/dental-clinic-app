import 'dotenv/config';
import pool from './src/config/db.js';
import fs from 'fs';

async function dump() {
    try {
        console.log("--- Dumping Ammar's Data to JSON ---");

        const patients = await pool.query("SELECT * FROM patients WHERE name ILIKE '%ammar%'");

        if (patients.rows.length > 0) {
            const pIds = patients.rows.map(p => p.id);
            const appts = await pool.query(`SELECT a.*, d.name as doctor_name FROM appointments a JOIN doctors d ON a.dentist_id = d.id WHERE a.patient_id = ANY($1) ORDER BY a.appointment_date DESC, a.appointment_time DESC`, [pIds]);

            fs.writeFileSync('ammar_appts.json', JSON.stringify({
                patients: patients.rows,
                appointments: appts.rows
            }, null, 2));
            console.log("Dumped to ammar_appts.json");
        } else {
            console.log("No patient ammar found");
        }

    } catch (err) {
        console.error("DIAGNOSE ERROR:", err);
    } finally {
        process.exit();
    }
}

dump();

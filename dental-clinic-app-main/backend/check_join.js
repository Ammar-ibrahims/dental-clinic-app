import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'appointments'
        `);
        console.log("Appointments Table Schema:");
        console.table(res.rows);

        const patientIdSample = await pool.query("SELECT patient_id FROM appointments LIMIT 1");
        if (patientIdSample.rows.length > 0) {
            console.log("Sample patient_id value:", patientIdSample.rows[0].patient_id);
            console.log("Type of sample value:", typeof patientIdSample.rows[0].patient_id);
        }

        const joinTest = await pool.query(`
            SELECT a.id, a.patient_id, p.id as p_id, p.email
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = CAST(p.id AS VARCHAR)
            LIMIT 5
        `);
        console.log("Join Test Results (with current logic):");
        console.table(joinTest.rows);

        const joinTest2 = await pool.query(`
            SELECT a.id, a.patient_id, p.id as p_id, p.email
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id::integer = p.id
            LIMIT 5
        `);
        console.log("Join Test Results (with casting to integer):");
        console.table(joinTest2.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();

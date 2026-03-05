import pool from './src/config/db.js';

const fix = async () => {
    try {
        // Check what type patient_id is
        const colInfo = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'appointments' AND column_name = 'patient_id';
        `);
        console.log('patient_id column info:', colInfo.rows[0]);

        // Check FK constraints
        const fkInfo = await pool.query(`
            SELECT conname FROM pg_constraint WHERE conname = 'appointments_patient_id_fkey';
        `);
        console.log('FK exists:', fkInfo.rows.length > 0);

        // Try to query appointments
        const appts = await pool.query(`
            SELECT a.id, a.patient_id, a.dentist_id, a.appointment_date, a.appointment_time, a.status
            FROM appointments a LIMIT 3;
        `);
        console.log('Sample appointments:', appts.rows);

        // Try the full joined query
        const full = await pool.query(`
            SELECT a.*, p.name AS patient_name, d.name AS dentist_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN dentists d ON a.dentist_id = d.id
            LIMIT 3;
        `);
        console.log('Joined query success:', full.rows);
    } catch (err) {
        console.error('❌ Query failed:', err.message);
    } finally {
        pool.end();
    }
};

fix();

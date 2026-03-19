import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/clinic_db' });

async function trace() {
    try {
        console.log("Testing getAppointmentById...");
        const res = await pool.query(`SELECT a.*, d.name AS dentist_name, p.email, p.name AS patient_name
           FROM appointments a
           JOIN doctors d ON a.dentist_id = d.id
           JOIN patients p ON CAST(a.patient_id AS INTEGER) = p.id
           WHERE a.id = 33`);
        console.log("getAppointmentById rows:", res.rows.length);

        console.log("Testing deleteAppointment...");
        const delRes = await pool.query('DELETE FROM appointments WHERE id=33 RETURNING id');
        console.log("Deleted rows:", delRes.rows.length, "ID:", delRes.rows[0]?.id);

    } catch (e) {
        console.error("Caught error:", e.message);
    } finally {
        pool.end();
    }
}
trace();

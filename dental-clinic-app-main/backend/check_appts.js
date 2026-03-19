import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/clinic_db' });
pool.query("SELECT id, patient_id, dentist_id, appointment_date, appointment_time, status, google_event_id FROM appointments ORDER BY id DESC LIMIT 5")
  .then(res => console.log(JSON.stringify(res.rows, null, 2)))
  .catch(console.error)
  .finally(() => pool.end());

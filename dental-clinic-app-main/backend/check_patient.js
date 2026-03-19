import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/clinic_db' });
pool.query("SELECT * FROM patients WHERE id = 15")
  .then(res => console.log('Patient 15:', res.rows))
  .catch(console.error)
  .finally(() => pool.end());

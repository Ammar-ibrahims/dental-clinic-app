import pg from 'pg';
import fs from 'fs';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/clinic_db' });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'patients'")
  .then(res => fs.writeFileSync('patients_columns.json', JSON.stringify(res.rows, null, 2)))
  .catch(console.error)
  .finally(() => pool.end());

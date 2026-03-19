import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT * FROM doctors WHERE id = 2")
  .then(res => console.log('Doctor 2:', res.rows))
  .catch(console.error)
  .finally(() => pool.end());

import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Check for the problem: deleted doctors still holding email addresses
pool.query("SELECT id, name, email, is_active FROM doctors WHERE email = 'amazhar2005@gmail.com'")
  .then(res => {
    console.log('Doctors with this email:', res.rows);
    // Fix: invalidate deleted doctor emails that are blocking
    return pool.query("UPDATE doctors SET email = email || '_deleted_' || EXTRACT(EPOCH FROM NOW()) WHERE email = 'amazhar2005@gmail.com' AND is_active = false RETURNING *");
  })
  .then(res => console.log('Fixed rows:', res.rows))
  .catch(console.error)
  .finally(() => pool.end());

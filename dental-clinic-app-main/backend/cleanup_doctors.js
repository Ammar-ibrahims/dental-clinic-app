import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function cleanup() {
    // Show all doctors (including soft-deleted ones)
    const docs = await pool.query('SELECT id, name, email, is_active FROM doctors ORDER BY id');
    console.log('ALL doctors in DB:', JSON.stringify(docs.rows, null, 2));

    // Invalidate emails of all soft-deleted doctors
    const fixed = await pool.query(
        "UPDATE doctors SET email = email || '_deleted_' || id || '_' || EXTRACT(EPOCH FROM NOW()) WHERE is_active = false AND email NOT LIKE '%_deleted_%' RETURNING id, email"
    );
    console.log('\nFixed soft-deleted doctor emails:', fixed.rows);

    // Show remaining state
    const after = await pool.query('SELECT id, name, email, is_active FROM doctors ORDER BY id');
    console.log('\nDoctors after fix:', JSON.stringify(after.rows, null, 2));

    pool.end();
}
cleanup().catch(e => { console.error(e); pool.end(); });

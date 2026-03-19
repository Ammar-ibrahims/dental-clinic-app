import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/clinic_db' });

async function fixDb() {
    try {
        await pool.query("ALTER TABLE patients ADD COLUMN IF NOT EXISTS document_url TEXT");
        console.log("Added document_url to patients");
    } catch(err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
fixDb();

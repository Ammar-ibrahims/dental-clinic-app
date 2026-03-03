import pool from './src/config/db.js';

const migrate = async () => {
    try {
        console.log('Running migration...');
        await pool.query(`
            ALTER TABLE dentists
            ADD COLUMN IF NOT EXISTS google_access_token TEXT,
            ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
            ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT;
        `);
        console.log('Migration successful: Google token columns added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
};

migrate();

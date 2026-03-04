import pool from './src/config/db.js';

const migrate = async () => {
    try {
        console.log('Running timezone migration...');
        await pool.query(`
            ALTER TABLE appointments
            ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Asia/Karachi';
        `);
        console.log('Migration successful: Timezone column added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
};

migrate();

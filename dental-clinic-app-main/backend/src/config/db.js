import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    host: (process.env.DB_HOST || 'localhost').trim(),
    port: parseInt((process.env.DB_PORT || '5432').trim()),
    database: (process.env.DB_NAME || 'clinic_db').trim(),
    user: (process.env.DB_USER || 'postgres').trim(),
    password: (process.env.DB_PASSWORD || 'admin').trim(),
});

// Log connection status once on startup
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to PostgreSQL database:', process.env.DB_NAME || 'clinic_db');
        release();
    }
});

export default pool;

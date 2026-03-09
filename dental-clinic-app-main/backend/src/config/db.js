import pg from 'pg';

const { Pool } = pg;

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    })
    : new Pool({
        host: (process.env.PGHOST || process.env.DB_HOST || 'localhost').trim(),
        port: parseInt((process.env.PGPORT || process.env.DB_PORT || '5432').trim()),
        database: (process.env.PGDATABASE || process.env.DB_NAME || 'clinic_db').trim(),
        user: (process.env.PGUSER || process.env.DB_USER || 'postgres').trim(),
        password: (process.env.PGPASSWORD || process.env.DB_PASSWORD || 'admin').trim(),
        ssl: process.env.PGHOST ? { rejectUnauthorized: false } : false
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

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function patch() {
    try {
        console.log("Connecting to database...");
        const res = await pool.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER');
        console.log("✅ Database patched successfully: 'age' column added to patients table.");
    } catch (err) {
        console.error("❌ Patch failed:", err.message);
    } finally {
        await pool.end();
    }
}

patch();

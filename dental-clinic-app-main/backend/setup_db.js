import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// Use your Railway connection string from your .env file
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    mongo_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function createTable() {
    try {
        console.log("⏳ Connecting to Railway PostgreSQL...");
        await pool.query(createTableQuery);
        console.log("✅ Patients table created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating table:", err.message);
        process.exit(1);
    }
}

createTable();
const { Client } = require('pg');

const connectionString = "postgresql://postgres:euSijEGmfuGZQpoKhNaUVasogCHiLXrY@trolley.proxy.rlwy.net:16184/railway";

const client = new Client({ connectionString });

// CORRECTED SQL FOR PATIENTS TABLE
const sql = `
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    mongo_id VARCHAR(50), 
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    address TEXT,
    medical_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function run() {
    console.log("🚀 Starting script for patients table...");
    try {
        await client.connect();
        console.log("🔗 Connected to Railway Postgres!");
        await client.query(sql);
        console.log("✅ SUCCESS: The 'patients' table has been created!");
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    } finally {
        await client.end();
        console.log("👋 Done.");
        process.exit();
    }
}

run();
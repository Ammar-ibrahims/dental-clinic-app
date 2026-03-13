const { Client } = require('pg');

// Your Railway Connection String
const connectionString = "postgresql://postgres:euSijEGmfuGZQpoKhNaUVasogCHiLXrY@trolley.proxy.rlwy.net:16184/railway";

const client = new Client({ connectionString });

const sql = `
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(255) NOT NULL,
    dentist_id INTEGER NOT NULL REFERENCES dentists(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME WITHOUT TIME ZONE NOT NULL,
    treatment_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    timezone VARCHAR(100) DEFAULT 'Asia/Karachi',
    google_event_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function run() {
    console.log("🚀 Creating appointments table...");
    try {
        await client.connect();
        console.log("🔗 Connected to Railway!");
        await client.query(sql);
        console.log("✅ SUCCESS: The 'appointments' table is ready!");
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    } finally {
        await client.end();
        process.exit();
    }
}

run();
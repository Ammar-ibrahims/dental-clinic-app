const { Client } = require('pg');

const connectionString = "postgresql://postgres:euSijEGmfuGZQpoKhNaUVasogCHiLXrY@trolley.proxy.rlwy.net:16184/railway";

const client = new Client({ connectionString });

const sql = `
CREATE TABLE dentists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    contact VARCHAR(20),
    bio TEXT,
    years_experience INTEGER DEFAULT 0,
    availability TEXT,
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    google_access_token TEXT
);
`;

async function run() {
    console.log("🚀 Starting script...");
    try {
        await client.connect();
        console.log("🔗 Connected to Railway Postgres!");
        await client.query(sql);
        console.log("✅ SUCCESS: The 'dentists' table has been created!");
    } catch (err) {
        if (err.message.includes("already exists")) {
            console.log("ℹ️ Note: Table already exists.");
        } else {
            console.error("❌ ERROR:", err.message);
        }
    } finally {
        await client.end();
        console.log("👋 Done.");
        process.exit();
    }
}

run();
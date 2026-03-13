const { Client } = require('pg');

// Your Railway Connection String
const connectionString = "postgresql://postgres:euSijEGmfuGZQpoKhNaUVasogCHiLXrY@trolley.proxy.rlwy.net:16184/railway";

const client = new Client({ connectionString });

async function run() {
    try {
        await client.connect();
        console.log("🔗 Connected to Railway Postgres!");

        // This command adds the missing columns so the Google login can save the data
        const sql = `
            ALTER TABLE dentists 
            ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
            ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT;
        `;

        await client.query(sql);
        console.log("✅ SUCCESS: Missing columns added to 'dentists' table!");

        // Let's also double check the table is there
        const res = await client.query("SELECT count(*) FROM dentists");
        console.log(`📊 Verified: The dentists table exists and has ${res.rows[0].count} doctors in it.`);

    } catch (err) {
        console.error("❌ ERROR:", err.message);
    } finally {
        await client.end();
        process.exit();
    }
}

run();
import 'dotenv/config';
import pool from './src/config/db.js';

async function listTables() {
    try {
        console.log("--- 🕵️ Table Listing ---");
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tables in DB:");
        console.table(res.rows);
    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        process.exit();
    }
}

listTables();

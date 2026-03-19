import 'dotenv/config';
import pool from './src/config/db.js';

async function fixDb() {
    try {
        console.log("Checking for missing columns in 'patients' table...");

        // Add document_url if it doesn't exist
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='document_url') THEN
                    ALTER TABLE patients ADD COLUMN document_url TEXT;
                    RAISE NOTICE 'Added document_url column to patients table.';
                ELSE
                    RAISE NOTICE 'document_url column already exists.';
                END IF;
            END $$;
        `);

        console.log("✅ Database columns checked and updated!");
    } catch (err) {
        console.error("❌ Database update failed:", err.message);
    } finally {
        pool.end();
    }
}

fixDb();

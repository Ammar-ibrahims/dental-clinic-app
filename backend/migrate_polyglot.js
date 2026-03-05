import pool from './src/config/db.js';

const fixSchema = async () => {
    try {
        console.log('Altering appointments table to support MongoDB Patient IDs...');

        // 1. Drop the foreign key constraint because it points to the old SQL patients table
        await pool.query(`
            ALTER TABLE appointments 
            DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
        `);

        // 2. Change patient_id column from INTEGER to VARCHAR to hold MongoDB ObjectIDs
        await pool.query(`
            ALTER TABLE appointments 
            ALTER COLUMN patient_id TYPE VARCHAR(50);
        `);

        console.log('✅ SQL Schema Updated: patient_id is now VARCHAR and unconstrained.');
    } catch (err) {
        console.error('❌ Schema update failed:', err);
    } finally {
        pool.end();
    }
};

fixSchema();

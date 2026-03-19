import 'dotenv/config';
import pool from './src/config/db.js';

async function inspect() {
    const email = 'amazhar2005@gmail.com';
    try {
        console.log(`--- Inspecting Database for email: ${email} ---`);

        // 1. Check tables existence
        const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log("Existing Tables:", tables);

        // 2. Check each table for the email
        for (const table of ['users', 'patients', 'doctors', 'dentists']) {
            if (tables.includes(table)) {
                const res = await pool.query(`SELECT id, email FROM ${table} WHERE email = $1`, [email]);
                console.log(`Search in ${table}:`, res.rows);
            } else {
                console.log(`Table ${table} does not exist.`);
            }
        }

        // 3. Check constraints for 'doctors' and 'dentists'
        for (const table of ['doctors', 'dentists']) {
            if (tables.includes(table)) {
                console.log(`\n--- Constraints for ${table} ---`);
                const conRes = await pool.query(`
                    SELECT 
                        tc.constraint_name, 
                        tc.table_name, 
                        kcu.column_name, 
                        tc.constraint_type
                    FROM 
                        information_schema.table_constraints AS tc 
                        JOIN information_schema.key_column_usage AS kcu
                          ON tc.constraint_name = kcu.constraint_name
                          AND tc.table_schema = kcu.table_schema
                    WHERE tc.table_schema = 'public' AND tc.table_name = $1;
                `, [table]);
                console.table(conRes.rows);
            }
        }

    } catch (err) {
        console.error("Inspection Error:", err);
    } finally {
        pool.end();
        process.exit(0);
    }
}

inspect();

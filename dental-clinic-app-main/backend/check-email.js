import 'dotenv/config';
import pool from './src/config/db.js';

async function check() {
    const email = 'amazhar2005@gmail.com';
    try {
        console.log(`Checking email: ${email}`);

        const tables = ['users', 'patients', 'doctors', 'dentists'];
        for (const table of tables) {
            try {
                const res = await pool.query(`SELECT id, email FROM ${table} WHERE email = $1`, [email]);
                if (res.rows.length > 0) {
                    console.log(`FOUND_IN_${table.toUpperCase()}:`, res.rows[0]);
                } else {
                    console.log(`NOT_FOUND_IN_${table.toUpperCase()}`);
                }
            } catch (err) {
                console.log(`ERROR_IN_${table.toUpperCase()}: ${err.message}`);
            }
        }

        const constraints = await pool.query(
            "SELECT table_name, constraint_name FROM information_schema.key_column_usage WHERE column_name = 'email' AND constraint_name LIKE '%email_key%'"
        );
        console.log("Constraints on email columns:", constraints.rows);

    } catch (err) {
        console.error("Check Error:", err);
    } finally {
        pool.end();
        process.exit(0);
    }
}

check();

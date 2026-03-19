import 'dotenv/config';
import bcrypt from 'bcrypt';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createAdmin() {
    // EDIT THESE CREDENTIALS
    const adminEmail = 'admin';
    const adminPassword = 'admin@1122';
    const adminRole = 'admin';

    try {
        console.log("⏳ Checking if admin already exists...");
        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);

        if (existing.rows.length > 0) {
            console.log("❌ Admin with this email already exists!");
            process.exit(0);
        }

        console.log("⏳ Hashing password...");
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        console.log("⏳ Creating admin user...");
        await pool.query(
            'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
            [adminEmail, hashedPassword, adminRole]
        );

        console.log(`✅ Admin created successfully!`);
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log("You can now log in to the Staff Portal.");

        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating admin:", err.message);
        process.exit(1);
    }
}

createAdmin();

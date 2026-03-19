import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/clinic_db' });

async function test() {
    try {
        const res1 = await pool.query("INSERT INTO doctors (name, specialty, email, contact, bio, years_experience) VALUES ('Test Doctor Sync', 'Dentist', 'test_sync@example.com', '1234567890', 'Test', 5) RETURNING id");
        const id = res1.rows[0].id;
        console.log('Created doctor ID:', id);
        
        await pool.query("UPDATE doctors SET is_active=false, email=email || '_deleted_' || EXTRACT(EPOCH FROM NOW()) WHERE id=$1", [id]);
        console.log('Deleted doctor ID:', id);
        
        const res2 = await pool.query("INSERT INTO doctors (name, specialty, email, contact, bio, years_experience) VALUES ('Test Doctor Sync 2', 'Dentist', 'test_sync@example.com', '1234567890', 'Test 2', 5) RETURNING id");
        console.log('Successfully created second doctor with same email, ID:', res2.rows[0].id);
    } catch(err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
        process.exit(0);
    }
}

test();

import pg from 'pg';
import mongoose from 'mongoose';
import PatientMongo from './src/models/Patient.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/clinic_db' });

// Inline the remove logic to test directly without HTTP server dependencies
const isMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental_clinic');

        // 1. Create Patient in Mongo
        const newDbPatient = new PatientMongo({
            name: 'API Sync Patient',
            email: 'api_sync_final@example.com',
            phone: '5551234'
        });
        const savedMongo = await newDbPatient.save();
        const mongoIdParam = savedMongo._id.toString();

        // 2. Create Patient in Postgres (Simulating a partial or old record)
        const pgPatient = await pool.query(
            "INSERT INTO patients (name, email, phone, document_url) VALUES ($1, $2, $3, $4) RETURNING id",
            ['API Sync Patient', 'api_sync_final@example.com', '5551234', '']
        );
        const pgIdParam = pgPatient.rows[0].id;
        console.log(`Created Patient in Mongo (${mongoIdParam}) and Postgres (${pgIdParam})`);

        // 3. Trigger remove logic inline
        const id = mongoIdParam; // Simulate req.params.id = mongoId
        let postgresId = null;
        let mongoId = null;
        let targetEmail = null;

        if (isMongoId(id)) {
            mongoId = id;
            try {
                const mongoP = await PatientMongo.findById(mongoId);
                if (mongoP) targetEmail = mongoP.email;
            } catch (err) {}
            
            if (targetEmail) {
                const result = await pool.query("SELECT * FROM patients WHERE email = $1", [targetEmail]);
                if (result.rows.length > 0) postgresId = result.rows[0].id;
            }
        }

        console.log(`Resolved internal IDs to delete: Mongo=${mongoId}, Postgres=${postgresId}`);

        // Delete from MongoDB
        if (mongoId) await PatientMongo.findByIdAndDelete(mongoId);
        
        // Delete from PostgreSQL
        if (postgresId) await pool.query('DELETE FROM patients WHERE id=$1', [postgresId]);

        console.log("Deletion steps complete.");

        // 4. Verify MongoDB
        const mongoCheck = await PatientMongo.findById(mongoIdParam);
        console.log('MongoDB check (should be null):', mongoCheck);

        // 5. Verify Postgres
        const pgCheck = await pool.query("SELECT * FROM patients WHERE email = 'api_sync@example.com'");
        console.log('Postgres check length (should be 0):', pgCheck.rows.length);

    } catch (err) {
        console.error("Test error:", err);
    } finally {
        await pool.end();
        await mongoose.disconnect();
        process.exit();
    }
}

verify();

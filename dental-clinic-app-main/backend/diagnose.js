import 'dotenv/config';
import pool from './src/config/db.js';
import * as appointmentSyncService from './src/services/appointmentSyncService.js';
import * as DoctorModel from './src/models/doctorModel.js';

async function diagnose() {
    try {
        console.log("Fetching latest appointment...");
        const res = await pool.query('SELECT * FROM appointments ORDER BY id DESC LIMIT 1');
        if (res.rows.length === 0) {
            console.log("No appointments found.");
            return;
        }

        const appt = res.rows[0];
        console.log("Latest Appointment:", appt);

        console.log("Checking doctor tokens for dentist_id:", appt.dentist_id);
        const tokensRes = await DoctorModel.getDoctorTokens(appt.dentist_id);
        if (tokensRes.rows.length === 0) {
            console.log("No tokens found for doctor.");
            return;
        }
        console.log("Tokens exist:", tokensRes.rows[0].google_access_token ? "Yes" : "No");
        console.log("Tokens details:", {
            access: tokensRes.rows[0].google_access_token ? 'Present' : 'Missing',
            refresh: tokensRes.rows[0].google_refresh_token ? 'Present' : 'Missing',
            expiry: tokensRes.rows[0].google_token_expiry
        });

        console.log("Running Sync...");
        await appointmentSyncService.syncAppointmentToGoogle(appt.id);
        console.log("Sync script finished.");

        // Check if DB updated
        const checkRes = await pool.query('SELECT google_event_id FROM appointments WHERE id = $1', [appt.id]);
        console.log("Final google_event_id:", checkRes.rows[0].google_event_id);

    } catch (err) {
        console.error("Diagnosis Error:", err);
    } finally {
        pool.end();
        process.exit(0);
    }
}

diagnose();

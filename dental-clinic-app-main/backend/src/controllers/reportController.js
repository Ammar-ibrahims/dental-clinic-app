import pool from '../config/db.js';
import * as upstash from '../services/upstashService.js';

/**
 * Controller to fetch detailed reporting data for the Admin Portal.
 */
export const getReportData = async (req, res) => {
    try {
        // Force non-cached response for browser, but use Redis for server-side
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

        // 0. Check Cache First
        const cacheKey = 'admin_report_data';
        const cachedData = await upstash.getCache(cacheKey);
        if (cachedData) {
            console.log('✅ Serving reports from Upstash cache');
            return res.json(cachedData);
        }

        // 1. Appointments by Status
        const statusRes = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM appointments 
            GROUP BY status
        `);

        // 2. Appointments by Treatment Type (Top 5)
        const treatmentRes = await pool.query(`
            SELECT COALESCE(treatment_type, 'General') as treatment, COUNT(*) as count 
            FROM appointments 
            GROUP BY treatment_type 
            ORDER BY count DESC 
            LIMIT 5
        `);

        // 3. Today's Appointments Details
        const todayDetailsRes = await pool.query(`
            SELECT 
                a.id,
                a.appointment_time,
                p.name as patient_name,
                d.name as doctor_name,
                a.treatment_type,
                a.status
            FROM appointments a
            JOIN patients p ON CAST(a.patient_id AS TEXT) = CAST(p.id AS TEXT)
            JOIN doctors d ON CAST(a.dentist_id AS TEXT) = CAST(d.id AS TEXT)
            WHERE TO_CHAR(a.appointment_date AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD') = 
                  TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD')
            ORDER BY a.appointment_time ASC
        `);

        // 4. Growth: Patients added in the last 30 days
        const growthRes = await pool.query(`
            SELECT COUNT(*) 
            FROM patients 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);

        const finalData = {
            statusBreakdown: statusRes.rows,
            treatmentTrends: treatmentRes.rows,
            todaySummary: todayDetailsRes.rows,
            newPatientsLast30Days: parseInt(growthRes.rows[0].count) || 0
        };

        // Cache for 5 minutes
        await upstash.setCache(cacheKey, finalData, 300);

        res.json(finalData);

    } catch (err) {
        console.error("Report Data Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

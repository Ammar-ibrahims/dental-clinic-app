import pool from '../config/db.js';
import * as upstash from '../services/upstashService.js';

export const getStats = async (req, res) => {
    try {
        // FORCE THE SERVER TO BYPASS CACHE (Prevents 304 errors)
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        console.log("--- FETCHING STATS (Checking Cache) ---");

        const cacheKey = 'global_stats';
        const cachedStats = await upstash.getCache(cacheKey);
        if (cachedStats) {
            console.log("✅ Serving stats from Upstash cache");
            return res.json(cachedStats);
        }

        const [patientResult, dentistResult, totalApptResult, todayApptResult] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM patients'),
            pool.query('SELECT COUNT(*) FROM doctors WHERE is_active = true'),
            pool.query("SELECT COUNT(*) FROM appointments WHERE status != 'Cancelled'"),
            pool.query(`
                SELECT COUNT(*) FROM appointments 
                WHERE TO_CHAR(appointment_date AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD') = 
                      TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD')
                AND status != 'Cancelled'
            `)
        ]);

        const stats = {
            total_patients: parseInt(patientResult.rows[0].count) || 0,
            total_dentists: parseInt(dentistResult.rows[0].count) || 0,
            total_appointments: parseInt(totalApptResult.rows[0].count) || 0,
            todays_appointments: parseInt(todayApptResult.rows[0].count) || 0,
        };

        // Cache for 10 minutes
        await upstash.setCache(cacheKey, stats, 600);

        console.log("FINAL STATS SENT TO FRONTEND:", stats);
        res.json(stats);

    } catch (err) {
        console.error("Dashboard Stats Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
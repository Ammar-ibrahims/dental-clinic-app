import { Router } from 'express';
import * as googleCalendarService from '../services/googleCalendarService.js';
import pool from '../config/db.js';

const router = Router();

// GET /api/auth/google?dentist_id=X
router.get('/google', (req, res) => {
    const { dentist_id } = req.query;
    if (!dentist_id) {
        return res.status(400).json({ error: 'dentist_id is required' });
    }

    const authUrl = googleCalendarService.getAuthUrl(dentist_id);
    res.redirect(authUrl);
});

// GET /api/auth/google/callback
router.get('/google/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        console.error('OAuth Error:', error);
        return res.redirect('http://localhost:5000/doctors?error=oauth_failed');
    }

    if (!code || !state) {
        return res.redirect('http://localhost:5000/doctors?error=missing_params');
    }

    try {
        const dentist_id = parseInt(state, 10);
        const tokens = await googleCalendarService.getTokens(code);

        // Save tokens to DB
        // google_token_expiry usually needs to be calculated if expiry_date is provided by google
        await pool.query(
            `UPDATE dentists 
             SET google_access_token = $1, 
                 google_refresh_token = $2, 
                 google_token_expiry = $3 
             WHERE id = $4`,
            [tokens.access_token, tokens.refresh_token, tokens.expiry_date, dentist_id]
        );

        // Redirect back to frontend Edit Doctor page
        res.redirect(`http://localhost:5000/doctors/${dentist_id}/edit?success=google_connected`);
    } catch (err) {
        console.error('Error in OAuth callback:', err);
        res.redirect('http://localhost:5000/doctors?error=token_exchange_failed');
    }
});

export default router;

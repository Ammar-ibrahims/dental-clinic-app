import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as googleCalendarService from '../services/googleCalendarService.js';
import pool from '../config/db.js';
import { rateLimit } from '../middleware/rateLimitMiddleware.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';
// Rate limiters: 10 attempts per minute for auth routes
const authLimiter = rateLimit(10, 60);

// ---------------------------------------------------------
// 1. USER REGISTRATION (Creates User + Patient record)
// ---------------------------------------------------------
router.post('/register', authLimiter, async (req, res) => {
    const { name, email, password, role } = req.body; // role: 'admin' or 'patient'

    try {
        // Check if user exists
        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) return res.status(400).json({ error: "Email already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Save to users table
        const userResult = await pool.query(
            'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, hashedPassword, role || 'patient']
        );
        const newUser = userResult.rows[0];

        // If it's a patient, also create a record in the patients table to link them
        if (newUser.role === 'patient') {
            await pool.query(
                'INSERT INTO patients (user_id, name, email) VALUES ($1, $2, $3)',
                [newUser.id, name, email]
            );
        }

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------
// 2. USER LOGIN (Returns Token + Role)
// ---------------------------------------------------------
router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Create a token that contains the user ID and their ROLE
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            role: user.role,
            message: `Logged in as ${user.role}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------
// 3. GOOGLE OAUTH ROUTES (Existing)
// ---------------------------------------------------------

// GET /api/auth/google?dentist_id=X&email=Y
router.get('/google', (req, res) => {
    const { dentist_id, email } = req.query;
    if (!dentist_id) return res.status(400).json({ error: 'dentist_id is required' });
    const authUrl = googleCalendarService.getAuthUrl(dentist_id, email);
    res.redirect(authUrl);
});

// GET /api/auth/google/callback
router.get('/google/callback', async (req, res) => {
    const { code, state, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://16.170.201.132.nip.io';

    if (error) return res.redirect(`${frontendUrl}/admin/doctors?error=oauth_failed`);
    if (!code || !state) return res.redirect(`${frontendUrl}/admin/doctors?error=missing_params`);

    try {
        const dentist_id = parseInt(state, 10);
        const tokens = await googleCalendarService.getTokens(code);

        await pool.query(
            `UPDATE doctors SET google_access_token = $1, google_refresh_token = $2, google_token_expiry = $3 WHERE id = $4`,
            [tokens.access_token, tokens.refresh_token, tokens.expiry_date, dentist_id]
        );

        res.redirect(`${frontendUrl}/admin/doctors/edit/${dentist_id}?success=google_connected`);
    } catch (err) {
        res.redirect(`${frontendUrl}/admin/doctors?error=token_exchange_failed`);
    }
});

export default router;
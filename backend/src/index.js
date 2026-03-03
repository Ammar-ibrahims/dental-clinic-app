import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// ─── Config ────────────────────────────────────────────────────
import './config/db.js'; // initializes pool & logs connection status

// ─── Route Modules ─────────────────────────────────────────────
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import treatmentRoutes from './routes/treatmentRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

const app = express();
const port = process.env.PORT || 8000;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check ──────────────────────────────────────────────
import pool from './config/db.js';

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: err.message });
  }
});

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/patients', patientRoutes);
app.use('/api/dentists', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/stats', statsRoutes);

// ─── Start Server ──────────────────────────────────────────────
app.listen(port, '0.0.0.0', () => {
  console.log(`🦷 Dental Clinic backend listening on http://0.0.0.0:${port}`);
});

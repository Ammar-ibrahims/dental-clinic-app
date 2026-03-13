import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose'; // Use static import instead of dynamic
import { authorize } from './middleware/authMiddleware.js'; // Import the guard


// ─── Config ────────────────────────────────────────────────────
import pool from './config/db.js';

// ─── Route Modules ─────────────────────────────────────────────
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import treatmentRoutes from './routes/treatmentRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const port = process.env.PORT || 8000;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// ─── MongoDB Connection ─────────────────────────────────────────
// Disable buffering: If the DB is not connected, fail INSTANTLY 
// instead of waiting 10 seconds.
mongoose.set('bufferCommands', false);

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err.message));
} else {
  console.error('❌ ERROR: MONGODB_URI is not defined in Railway Variables!');
}

// ─── Health Check ──────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const pgStatus = await pool.query('SELECT 1');
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'ok',
      postgres: 'connected',
      mongodb: mongoStatus
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stats', authorize(['admin']), statsRoutes);
app.use('/api/doctors', authorize(['admin']), doctorRoutes);
app.use('/api/patients', authorize(['admin', 'patient']), patientRoutes);
app.use('/api/appointments', authorize(['admin', 'patient']), appointmentRoutes);
app.use('/api/treatments', authorize(['admin', 'patient']), treatmentRoutes);
app.use('/api/stats', statsRoutes);

// ─── Start Server ──────────────────────────────────────────────
app.listen(port, '0.0.0.0', () => {
  console.log(`🦷 Dental Clinic backend listening on port ${port}`);
});
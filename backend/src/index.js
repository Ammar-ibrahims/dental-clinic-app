import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 8000;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Database Connection Pool ──────────────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'clinic_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database:', process.env.DB_NAME || 'clinic_db');
    release();
  }
});

// ─── Health Check ──────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  PATIENTS API
// ══════════════════════════════════════════════════════════════

// GET all patients
app.get('/api/patients', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM patients ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single patient by ID
app.get('/api/patients/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create patient
app.post('/api/patients', async (req, res) => {
  const { name, email, phone, date_of_birth, address, medical_history, blood_group, gender } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO patients (name, email, phone, date_of_birth, address, medical_history, blood_group, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, email, phone, date_of_birth, address, medical_history, blood_group, gender]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update patient
app.put('/api/patients/:id', async (req, res) => {
  const { name, email, phone, date_of_birth, address, medical_history, blood_group, gender } = req.body;
  try {
    const result = await pool.query(
      `UPDATE patients SET name=$1, email=$2, phone=$3, date_of_birth=$4,
       address=$5, medical_history=$6, blood_group=$7, gender=$8
       WHERE id=$9 RETURNING *`,
      [name, email, phone, date_of_birth, address, medical_history, blood_group, gender, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE patient
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM patients WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Patient deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  DENTISTS API
// ══════════════════════════════════════════════════════════════

// GET all dentists
app.get('/api/dentists', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dentists WHERE is_active = true ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single dentist by ID
app.get('/api/dentists/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dentists WHERE id=$1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Dentist not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create dentist
app.post('/api/dentists', async (req, res) => {
  const { name, specialty, email, contact, bio, years_experience, availability, profile_image_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO dentists (name, specialty, email, contact, bio, years_experience, availability, profile_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, specialty, email, contact, bio, years_experience, availability, profile_image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update dentist
app.put('/api/dentists/:id', async (req, res) => {
  const { name, specialty, email, contact, bio, years_experience, availability, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE dentists SET name=$1, specialty=$2, email=$3, contact=$4,
       bio=$5, years_experience=$6, availability=$7, is_active=$8
       WHERE id=$9 RETURNING *`,
      [name, specialty, email, contact, bio, years_experience, availability, is_active, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Dentist not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE dentist (soft delete)
app.delete('/api/dentists/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE dentists SET is_active=false WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Dentist not found' });
    res.json({ message: 'Dentist deactivated', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  APPOINTMENTS API
// ══════════════════════════════════════════════════════════════

// GET all appointments (with patient & dentist names joined)
app.get('/api/appointments', async (req, res) => {
  try {
    const query = `
      SELECT
        a.*,
        p.name  AS patient_name,
        p.phone AS patient_phone,
        d.name  AS dentist_name,
        d.specialty
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN dentists d ON a.dentist_id = d.id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single appointment
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, p.name AS patient_name, d.name AS dentist_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN dentists d ON a.dentist_id = d.id
       WHERE a.id=$1`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create appointment
app.post('/api/appointments', async (req, res) => {
  const { patient_id, dentist_id, appointment_date, appointment_time, treatment_type, notes, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO appointments (patient_id, dentist_id, appointment_date, appointment_time, treatment_type, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [patient_id, dentist_id, appointment_date, appointment_time, treatment_type, notes, status || 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update appointment status
app.patch('/api/appointments/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE appointment
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM appointments WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  TREATMENTS API
// ══════════════════════════════════════════════════════════════

// GET all treatments
app.get('/api/treatments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM treatments ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  DASHBOARD STATS API
// ══════════════════════════════════════════════════════════════

app.get('/api/stats', async (req, res) => {
  try {
    const [patients, dentists, appointments, todayAppts] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM patients'),
      pool.query('SELECT COUNT(*) FROM dentists WHERE is_active = true'),
      pool.query('SELECT COUNT(*) FROM appointments'),
      pool.query("SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE"),
    ]);
    res.json({
      total_patients: parseInt(patients.rows[0].count),
      total_dentists: parseInt(dentists.rows[0].count),
      total_appointments: parseInt(appointments.rows[0].count),
      todays_appointments: parseInt(todayAppts.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ──────────────────────────────────────────────
app.listen(port, '0.0.0.0', () => {
  console.log(`🦷 Dental Clinic backend listening on http://0.0.0.0:${port}`);
});

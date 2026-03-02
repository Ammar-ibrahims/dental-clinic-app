import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Patients API
app.get('/api/patients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  const { name, email, phone, date_of_birth, address, medical_history } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO patients (name, email, phone, date_of_birth, address, medical_history) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, phone, date_of_birth, address, medical_history]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dentists API below
app.get('/api/dentists', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dentists ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Appointments API
app.get('/api/appointments', async (req, res) => {
  try {
    const query = `
      SELECT a.*, p.name as patient_name, d.name as dentist_name
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

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on 0.0.0.0:${port}`);
});

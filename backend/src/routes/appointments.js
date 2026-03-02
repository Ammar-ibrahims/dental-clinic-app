import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

const withNames = `
  SELECT a.*, p.name as patientName, d.name as dentistName
  FROM appointments a
  LEFT JOIN patients p ON a.patientId = p.id
  LEFT JOIN dentists d ON a.dentistId = d.id
`;

router.get('/', (req, res) => {
  const db = getDb();
  const appointments = db.prepare(`${withNames} ORDER BY a.date DESC, a.time DESC`).all();
  res.json(appointments);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const appointment = db.prepare(`${withNames} WHERE a.id = ?`).get(req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
  res.json(appointment);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { patientId, dentistId, date, time, duration, status, treatment, notes } = req.body;
  const result = db.prepare(
    'INSERT INTO appointments (patientId, dentistId, date, time, duration, status, treatment, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(patientId, dentistId, date, time, duration || 30, status || 'scheduled', treatment, notes);
  const appointment = db.prepare(`${withNames} WHERE a.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(appointment);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { patientId, dentistId, date, time, duration, status, treatment, notes } = req.body;
  db.prepare(
    'UPDATE appointments SET patientId=?, dentistId=?, date=?, time=?, duration=?, status=?, treatment=?, notes=? WHERE id=?'
  ).run(patientId, dentistId, date, time, duration, status, treatment, notes, req.params.id);
  const appointment = db.prepare(`${withNames} WHERE a.id = ?`).get(req.params.id);
  res.json(appointment);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;

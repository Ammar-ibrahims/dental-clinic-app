import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const patients = db.prepare('SELECT * FROM patients ORDER BY name').all();
  res.json(patients);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, email, phone, dateOfBirth, address, medicalHistory } = req.body;
  const result = db.prepare(
    'INSERT INTO patients (name, email, phone, dateOfBirth, address, medicalHistory) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, email, phone, dateOfBirth, address, medicalHistory);
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(patient);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, email, phone, dateOfBirth, address, medicalHistory } = req.body;
  db.prepare(
    'UPDATE patients SET name=?, email=?, phone=?, dateOfBirth=?, address=?, medicalHistory=? WHERE id=?'
  ).run(name, email, phone, dateOfBirth, address, medicalHistory, req.params.id);
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  res.json(patient);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;

import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const dentists = db.prepare('SELECT * FROM dentists ORDER BY name').all();
  res.json(dentists);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const dentist = db.prepare('SELECT * FROM dentists WHERE id = ?').get(req.params.id);
  if (!dentist) return res.status(404).json({ error: 'Dentist not found' });
  res.json(dentist);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, email, phone, specialization, schedule } = req.body;
  const result = db.prepare(
    'INSERT INTO dentists (name, email, phone, specialization, schedule) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email, phone, specialization, schedule);
  const dentist = db.prepare('SELECT * FROM dentists WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(dentist);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, email, phone, specialization, schedule } = req.body;
  db.prepare(
    'UPDATE dentists SET name=?, email=?, phone=?, specialization=?, schedule=? WHERE id=?'
  ).run(name, email, phone, specialization, schedule, req.params.id);
  const dentist = db.prepare('SELECT * FROM dentists WHERE id = ?').get(req.params.id);
  res.json(dentist);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM dentists WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;

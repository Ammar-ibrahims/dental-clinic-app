import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const treatments = db.prepare('SELECT * FROM treatments ORDER BY category, name').all();
  res.json(treatments);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const treatment = db.prepare('SELECT * FROM treatments WHERE id = ?').get(req.params.id);
  if (!treatment) return res.status(404).json({ error: 'Treatment not found' });
  res.json(treatment);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, description, duration, cost, category } = req.body;
  const result = db.prepare(
    'INSERT INTO treatments (name, description, duration, cost, category) VALUES (?, ?, ?, ?, ?)'
  ).run(name, description, duration, cost, category);
  const treatment = db.prepare('SELECT * FROM treatments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(treatment);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, description, duration, cost, category } = req.body;
  db.prepare(
    'UPDATE treatments SET name=?, description=?, duration=?, cost=?, category=? WHERE id=?'
  ).run(name, description, duration, cost, category, req.params.id);
  const treatment = db.prepare('SELECT * FROM treatments WHERE id = ?').get(req.params.id);
  res.json(treatment);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM treatments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;

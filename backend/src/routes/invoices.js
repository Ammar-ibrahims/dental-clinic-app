import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

const withNames = `
  SELECT i.*, p.name as patientName
  FROM invoices i
  LEFT JOIN patients p ON i.patientId = p.id
`;

router.get('/', (req, res) => {
  const db = getDb();
  const invoices = db.prepare(`${withNames} ORDER BY i.issuedAt DESC`).all();
  const items = db.prepare('SELECT * FROM invoice_items').all();
  const result = invoices.map(inv => ({
    ...inv,
    items: items.filter(it => it.invoiceId === inv.id),
  }));
  res.json(result);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const invoice = db.prepare(`${withNames} WHERE i.id = ?`).get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoiceId = ?').all(req.params.id);
  res.json({ ...invoice, items });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { appointmentId, patientId, amount, status, dueDate, items } = req.body;
  const result = db.prepare(
    'INSERT INTO invoices (appointmentId, patientId, amount, status, dueDate) VALUES (?, ?, ?, ?, ?)'
  ).run(appointmentId, patientId, amount, status || 'pending', dueDate);
  const invoiceId = result.lastInsertRowid;
  if (items && items.length > 0) {
    const insertItem = db.prepare('INSERT INTO invoice_items (invoiceId, treatmentName, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?)');
    for (const item of items) {
      insertItem.run(invoiceId, item.treatmentName, item.quantity, item.unitPrice, item.total);
    }
  }
  const invoice = db.prepare(`${withNames} WHERE i.id = ?`).get(invoiceId);
  res.status(201).json(invoice);
});

router.patch('/:id/pay', (req, res) => {
  const db = getDb();
  db.prepare("UPDATE invoices SET status='paid', paidAt=datetime('now') WHERE id=?").run(req.params.id);
  const invoice = db.prepare(`${withNames} WHERE i.id = ?`).get(req.params.id);
  res.json(invoice);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM invoice_items WHERE invoiceId = ?').run(req.params.id);
  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;

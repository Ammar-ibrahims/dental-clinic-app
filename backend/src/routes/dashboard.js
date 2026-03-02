import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/stats', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
  const todayAppointments = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE date = ?").get(today).count;
  const pendingInvoices = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status IN ('pending', 'overdue')").get().count;
  const monthlyRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status='paid' AND issuedAt >= ?").get(monthStart).total;

  const recentAppointments = db.prepare(`
    SELECT a.*, p.name as patientName, d.name as dentistName
    FROM appointments a
    LEFT JOIN patients p ON a.patientId = p.id
    LEFT JOIN dentists d ON a.dentistId = d.id
    WHERE a.date <= ?
    ORDER BY a.date DESC, a.time DESC
    LIMIT 5
  `).all(today);

  const upcomingAppointments = db.prepare(`
    SELECT a.*, p.name as patientName, d.name as dentistName
    FROM appointments a
    LEFT JOIN patients p ON a.patientId = p.id
    LEFT JOIN dentists d ON a.dentistId = d.id
    WHERE a.date > ? AND a.status = 'scheduled'
    ORDER BY a.date ASC, a.time ASC
    LIMIT 5
  `).all(today);

  res.json({
    totalPatients,
    todayAppointments,
    pendingInvoices,
    monthlyRevenue,
    recentAppointments,
    upcomingAppointments,
  });
});

export default router;

import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import patientsRouter from './routes/patients.js';
import dentistsRouter from './routes/dentists.js';
import appointmentsRouter from './routes/appointments.js';
import treatmentsRouter from './routes/treatments.js';
import invoicesRouter from './routes/invoices.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

initDb();

app.use('/api/patients', patientsRouter);
app.use('/api/dentists', dentistsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/treatments', treatmentsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Dental Clinic API running on http://127.0.0.1:${PORT}`);
});

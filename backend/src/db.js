import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../dental_clinic.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      dateOfBirth TEXT,
      address TEXT,
      medicalHistory TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dentists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      specialization TEXT,
      schedule TEXT
    );

    CREATE TABLE IF NOT EXISTS treatments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      duration INTEGER DEFAULT 30,
      cost REAL DEFAULT 0,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      dentistId INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration INTEGER DEFAULT 30,
      status TEXT DEFAULT 'scheduled',
      treatment TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patientId) REFERENCES patients(id),
      FOREIGN KEY (dentistId) REFERENCES dentists(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointmentId INTEGER,
      patientId INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      issuedAt TEXT DEFAULT (datetime('now')),
      dueDate TEXT,
      paidAt TEXT,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL,
      treatmentName TEXT,
      quantity INTEGER DEFAULT 1,
      unitPrice REAL,
      total REAL,
      FOREIGN KEY (invoiceId) REFERENCES invoices(id)
    );
  `);

  seedData(db);
  console.log('Database initialized');
}

function seedData(db) {
  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get();
  if (patientCount.count > 0) return;

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  db.prepare(`INSERT INTO dentists (name, email, phone, specialization, schedule) VALUES
    ('Dr. Sarah Johnson', 'sarah@dentalcare.com', '555-0101', 'General Dentistry', 'Mon-Fri 8am-5pm'),
    ('Dr. Michael Chen', 'michael@dentalcare.com', '555-0102', 'Orthodontics', 'Tue-Sat 9am-6pm'),
    ('Dr. Emily Rodriguez', 'emily@dentalcare.com', '555-0103', 'Oral Surgery', 'Mon-Thu 7am-4pm')`).run();

  db.prepare(`INSERT INTO treatments (name, description, duration, cost, category) VALUES
    ('Teeth Cleaning', 'Professional dental cleaning and polishing', 60, 120, 'Preventive'),
    ('Cavity Filling', 'Composite resin filling for tooth decay', 45, 200, 'Restorative'),
    ('Teeth Whitening', 'Professional whitening treatment', 90, 350, 'Cosmetic'),
    ('Braces Consultation', 'Initial orthodontic assessment', 30, 80, 'Orthodontic'),
    ('Tooth Extraction', 'Surgical removal of problematic tooth', 60, 280, 'Surgical'),
    ('Root Canal', 'Endodontic therapy for infected tooth', 90, 850, 'Restorative'),
    ('Dental X-Ray', 'Full mouth radiographic examination', 20, 90, 'Preventive'),
    ('Crown Placement', 'Ceramic crown fitting and bonding', 120, 1200, 'Restorative')`).run();

  db.prepare(`INSERT INTO patients (name, email, phone, dateOfBirth, address, medicalHistory) VALUES
    ('Alice Thompson', 'alice@email.com', '555-1001', '1985-03-15', '123 Oak St', 'No known allergies'),
    ('Bob Martinez', 'bob@email.com', '555-1002', '1990-07-22', '456 Maple Ave', 'Penicillin allergy'),
    ('Carol White', 'carol@email.com', '555-1003', '1978-11-05', '789 Pine Rd', 'Diabetes'),
    ('David Kim', 'david@email.com', '555-1004', '1995-02-14', '321 Elm St', 'None'),
    ('Eva Garcia', 'eva@email.com', '555-1005', '1982-09-30', '654 Birch Blvd', 'Hypertension')`).run();

  db.prepare(`INSERT INTO appointments (patientId, dentistId, date, time, duration, status, treatment, notes) VALUES
    (1, 1, '${yesterday}', '09:00', 60, 'completed', 'Teeth Cleaning', 'Routine cleaning done'),
    (2, 2, '${yesterday}', '10:30', 30, 'completed', 'Braces Consultation', 'Ready for braces'),
    (3, 1, '${today}', '11:00', 45, 'scheduled', 'Cavity Filling', 'Upper left molar'),
    (4, 3, '${today}', '14:00', 60, 'scheduled', 'Tooth Extraction', 'Wisdom tooth'),
    (5, 1, '${tomorrow}', '09:30', 60, 'scheduled', 'Teeth Cleaning', 'First visit'),
    (1, 2, '${tomorrow}', '11:00', 30, 'scheduled', 'Braces Consultation', 'Follow-up')`).run();

  db.prepare(`INSERT INTO invoices (appointmentId, patientId, amount, status, dueDate) VALUES
    (1, 1, 120, 'paid', '${today}'),
    (2, 2, 80, 'paid', '${today}'),
    (3, 3, 200, 'pending', '${tomorrow}'),
    (4, 4, 280, 'pending', '${tomorrow}')`).run();

  db.prepare(`UPDATE invoices SET paidAt = datetime('now') WHERE status = 'paid'`).run();

  console.log('Seed data inserted');
}

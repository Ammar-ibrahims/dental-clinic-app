-- ============================================================
--  Dental Clinic Database — Enhanced Schema
--  Database: clinic_db
-- ============================================================

-- Enable pgcrypto for UUID support (optional, useful later)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. PATIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(100)  NOT NULL,
    email            VARCHAR(150)  UNIQUE,
    phone            VARCHAR(20),
    date_of_birth    DATE,
    address          TEXT,
    medical_history  TEXT,
    blood_group      VARCHAR(5),
    gender           VARCHAR(10)   CHECK (gender IN ('Male','Female','Other')),
    created_at       TIMESTAMP     DEFAULT NOW(),
    updated_at       TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- 2. DENTISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS dentists (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(100)  NOT NULL,
    specialty         VARCHAR(100),
    email             VARCHAR(150)  UNIQUE,
    contact           VARCHAR(20),
    bio               TEXT,
    years_experience  INT           DEFAULT 0,
    availability      TEXT,          -- e.g. "Mon, Wed, Fri"
    profile_image_url TEXT,
    is_active         BOOLEAN       DEFAULT true,
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_token_expiry BIGINT,
    created_at        TIMESTAMP     DEFAULT NOW(),
    updated_at        TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- 3. APPOINTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id                SERIAL PRIMARY KEY,
    patient_id        VARCHAR(50)   NOT NULL,
    dentist_id        INT           NOT NULL REFERENCES dentists(id)  ON DELETE CASCADE,
    appointment_date  DATE          NOT NULL,
    appointment_time  TIME          NOT NULL,
    treatment_type    VARCHAR(100),
    status            VARCHAR(50)   NOT NULL DEFAULT 'Pending'
                                    CHECK (status IN ('Pending','Confirmed','Completed','Cancelled')),
    notes             TEXT,
    timezone          VARCHAR(50)   DEFAULT 'Asia/Karachi',
    created_at        TIMESTAMP     DEFAULT NOW(),
    updated_at        TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- 4. TREATMENTS TABLE  (catalogue of available treatments)
-- ============================================================
CREATE TABLE IF NOT EXISTS treatments (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    duration_minutes INT DEFAULT 30,
    base_price  NUMERIC(10,2),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 5. INVOICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
    id              SERIAL PRIMARY KEY,
    appointment_id  INT           NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    amount          NUMERIC(10,2) NOT NULL,
    paid            BOOLEAN       DEFAULT false,
    paid_at         TIMESTAMP,
    created_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- AUTO-UPDATE updated_at via trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'patients_updated_at') THEN
        CREATE TRIGGER patients_updated_at
            BEFORE UPDATE ON patients
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'dentists_updated_at') THEN
        CREATE TRIGGER dentists_updated_at
            BEFORE UPDATE ON dentists
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'appointments_updated_at') THEN
        CREATE TRIGGER appointments_updated_at
            BEFORE UPDATE ON appointments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================
-- INDEXES for common queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_appointments_date      ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient   ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist   ON appointments(dentist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status    ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_patients_email         ON patients(email);
CREATE INDEX IF NOT EXISTS idx_dentists_specialty     ON dentists(specialty);

-- ============================================================
-- SEED DATA — Dentists (matches frontend mockData)
-- ============================================================
INSERT INTO dentists (name, specialty, email, contact, availability, years_experience, bio)
VALUES
  ('Dr. Sarah Smith',  'Orthodontist',      'sarah.smith@clinic.com',  '0300-1111111', 'Mon, Wed, Fri', 10,
   'Specialist in teeth alignment and braces with over 10 years of experience.'),
  ('Dr. John Doe',     'General Dentist',   'john.doe@clinic.com',     '0300-2222222', 'Tue, Thu',      8,
   'Expert in preventive dentistry and routine care.'),
  ('Dr. Emily Chen',   'Pediatric Dentist', 'emily.chen@clinic.com',   '0300-3333333', 'Mon-Fri',       6,
   'Dedicated to children dental health with a gentle approach.')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- SEED DATA — Sample Patients
-- ============================================================
INSERT INTO patients (name, email, phone, date_of_birth, address, gender, blood_group)
VALUES
  ('Alice Johnson', 'alice.j@example.com', '0301-0000001', '1990-05-14', '12 Oak Street, Lahore', 'Female', 'A+'),
  ('Bob Williams',  'bob.w@example.com',   '0301-0000002', '1985-11-22', '34 Pine Ave, Karachi',  'Male',   'O+')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- SEED DATA — Sample Treatments
-- ============================================================
INSERT INTO treatments (name, description, duration_minutes, base_price)
VALUES
  ('Tooth Cleaning',    'Professional dental cleaning',          30,  2500.00),
  ('Cavity Filling',    'Composite resin filling',               45,  4500.00),
  ('Root Canal',        'Endodontic root canal treatment',       90, 15000.00),
  ('Teeth Whitening',   'In-office whitening procedure',         60,  8000.00),
  ('Braces Fitting',    'Metal or ceramic braces installation',  90, 35000.00),
  ('Tooth Extraction',  'Simple or surgical extraction',         30,  3000.00),
  ('Dental X-Ray',      'Digital radiograph',                    15,  1200.00)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED DATA — Sample Appointments
-- ============================================================
INSERT INTO appointments (patient_id, dentist_id, appointment_date, appointment_time, treatment_type, status)
VALUES
  (1, 1, '2026-03-05', '10:00:00', 'Braces Fitting', 'Confirmed'),
  (2, 2, '2026-03-05', '14:00:00', 'Tooth Cleaning',  'Pending')
ON CONFLICT DO NOTHING;

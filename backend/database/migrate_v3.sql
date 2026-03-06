-- Migration to allow hybrid Patient IDs (SQL integers and Mongo strings) in appointments

-- 1. Drop the foreign key constraint that requires patient_id to exist in the SQL 'patients' table
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;

-- 2. Change the patient_id column type from INT to VARCHAR(50) to accept Mongo ObjectIDs
ALTER TABLE appointments ALTER COLUMN patient_id TYPE VARCHAR(50);

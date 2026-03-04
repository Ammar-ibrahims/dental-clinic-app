-- Add timezone column to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Asia/Karachi';

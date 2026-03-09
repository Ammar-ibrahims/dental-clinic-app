-- Add a partial unique constraint to prevent double-booking
-- A dentist cannot have two active appointments at the same date+time
-- (Cancelled appointments are excluded so the slot becomes free again)

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_dentist_slot
    ON appointments (dentist_id, appointment_date, appointment_time)
    WHERE status != 'Cancelled';

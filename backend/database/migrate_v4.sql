-- Migration to support Google Calendar event tracking for cancellations/deletions

-- 1. Add google_event_id column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;

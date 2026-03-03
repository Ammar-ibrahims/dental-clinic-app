-- Add Google Calendar integration columns to the dentists table

ALTER TABLE dentists
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT;

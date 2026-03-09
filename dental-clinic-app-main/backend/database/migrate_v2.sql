-- Migration to add missing columns for Google OAuth and Timezone

-- 1. Add Google OAuth columns to dentists table
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT;

-- 2. Add timezone column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Karachi';

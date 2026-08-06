-- backend/db/migrations/add_email_verify_expires.sql
-- New migration: adds email_verify_expires column to users table so OTP tokens
-- have a time-limited expiry (used for both registration and login OTPs).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verify_expires TIMESTAMPTZ;

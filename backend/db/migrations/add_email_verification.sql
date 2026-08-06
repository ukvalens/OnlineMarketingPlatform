-- backend/db/migrations/add_email_verification.sql
-- New migration: adds email_verified and email_verify_token columns to users
-- table to support the OTP-based email verification flow.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verify_token VARCHAR(255);

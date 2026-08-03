-- Run this if your database already exists and you need to add the visitor role
-- PostgreSQL does not support IF NOT EXISTS for enum values, so use this safe approach:

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'visitor'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'visitor' BEFORE 'client';
  END IF;
END$$;

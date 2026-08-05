-- Migration: add proposed_timeline to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proposed_timeline VARCHAR(200);

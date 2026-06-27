-- Migration: Add abandoned checkout recovery columns to orders table
-- Tracks whether an abandoned checkout recovery email has been sent (prevents duplicates)
-- This migration is additive and does not break existing orders.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS abandoned_email_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS abandoned_email_sent_at timestamptz;
-- Migration: Add email tracking columns to orders table
-- Tracks whether order confirmation email has been sent (prevents duplicates)

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS email_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
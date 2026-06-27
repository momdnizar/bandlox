-- Migration: Add order status workflow and shipping tracking columns
-- This migration is additive and does not break existing orders.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;

-- Update existing orders to have status_updated_at set to created_at
UPDATE orders SET status_updated_at = created_at WHERE status_updated_at IS NULL;
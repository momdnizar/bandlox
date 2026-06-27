-- Migration: Fix orders table schema to match checkout API expectations
-- The base orders table was created with a different schema than the code expects.
-- This migration adds the missing customer/shipping columns and renames `total` to `subtotal`.

-- Add customer information columns (currently the code inserts customer_name, email, phone, address, city, state, postal_code, country)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';

-- Add subtotal column (the code inserts `subtotal` but the schema has `total`)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal numeric;

-- Add payment_status, payment_method, paid_at (from migration 003)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Add email tracking columns (from migration 004)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS email_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- Add abandoned checkout columns (from migration 005)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS abandoned_email_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS abandoned_email_sent_at timestamptz;

-- Add shipping tracking columns (from migration 006)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;

-- Update existing orders to have status_updated_at set to created_at
UPDATE orders SET status_updated_at = created_at WHERE status_updated_at IS NULL;

-- Fix order_items table: add product_name and variant columns
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS variant text;
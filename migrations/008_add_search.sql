-- ============================================================
-- Migration 008: Search & Analytics
-- ============================================================

-- 1. Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Search events analytics table
CREATE TABLE IF NOT EXISTS search_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query               TEXT NOT NULL,
  results_count       INTEGER NOT NULL DEFAULT 0,
  clicked_product_id  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  search_events IS 'Analytics log of customer search queries and product clicks.';
COMMENT ON COLUMN search_events.query IS 'The search term entered by the customer.';
COMMENT ON COLUMN search_events.results_count IS 'Number of results returned for this query.';
COMMENT ON COLUMN search_events.clicked_product_id IS 'The product ID if a result was clicked.';

CREATE INDEX IF NOT EXISTS idx_search_events_query     ON search_events(query);
CREATE INDEX IF NOT EXISTS idx_search_events_created_at ON search_events(created_at DESC);

-- 3. Full-text search indexes on the products table
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING gin (COALESCE(description, '') gin_trgm_ops);
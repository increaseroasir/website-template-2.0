-- Product detail content fields (TVD-027). Run once against existing D1 DBs:
--   wrangler d1 execute <DB_NAME> --remote --file=functions/db/migrations/2026-07-product-content.sql
-- New DBs get these columns from schema.sql automatically.
ALTER TABLE products ADD COLUMN headline TEXT;
ALTER TABLE products ADD COLUMN hero_description TEXT;
ALTER TABLE products ADD COLUMN why_bullets TEXT DEFAULT '[]';
ALTER TABLE products ADD COLUMN long_description TEXT;
ALTER TABLE products ADD COLUMN best_for TEXT;

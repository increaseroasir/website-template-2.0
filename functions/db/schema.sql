CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  inventory_name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  monthly_payment INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  quantity INTEGER DEFAULT 0,
  primary_image TEXT,
  gallery_images TEXT DEFAULT '[]',
  quick_facts TEXT DEFAULT '[]',
  ghl_tags TEXT DEFAULT '[]',
  promo_label TEXT,
  delivery_promise TEXT,
  headline TEXT,
  positioning_label TEXT,
  hero_description TEXT,
  why_bullets TEXT DEFAULT '[]',
  long_description TEXT,
  best_for TEXT,
  sort_order INTEGER DEFAULT 0,
  featured INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch() * 1000),
  updated_at INTEGER DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured, sort_order);
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);

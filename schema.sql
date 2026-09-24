CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  formats TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL DEFAULT '',
  article_title TEXT NOT NULL DEFAULT '',
  article_content TEXT NOT NULL DEFAULT '',
  article_faqs TEXT NOT NULL DEFAULT '[]',
  images TEXT NOT NULL DEFAULT '[]',
  download_url TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  show_on_home INTEGER NOT NULL DEFAULT 0 CHECK (show_on_home IN (0, 1)),
  is_key_product INTEGER NOT NULL DEFAULT 0 CHECK (is_key_product IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0 CHECK(item_count >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_active_sort
ON products(active, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_products_home_sort
ON products(show_on_home, active, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_products_key
ON products(is_key_product, active);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_one_key
ON products(is_key_product) WHERE is_key_product = 1;

-- Retain IDs after deletion to prevent re-importing removed products.
CREATE TABLE IF NOT EXISTS deleted_products (
  id TEXT PRIMARY KEY,
  deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Persistent per-product click totals from the public Shop page.
CREATE TABLE IF NOT EXISTS product_clicks (
  product_id TEXT PRIMARY KEY,
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  last_clicked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_clicks_count
ON product_clicks(clicks DESC);

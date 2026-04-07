-- ─── RISHTEDAR DATABASE SCHEMA ──────────────────────────────────────────────
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── BUSINESSES (Locales) ────────────────────────────────────────────────────
-- Note: Businesses are defined in lib/locations.ts (static).
-- This table is for future CMS management.

-- ─── MENU ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- CLP stored as integer
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  dietary_tags TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  business_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT,
  delivery_latitude FLOAT,
  delivery_longitude FLOAT,
  order_type TEXT CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')) NOT NULL,
  items_count INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL,
  discount_applied INTEGER NOT NULL DEFAULT 0,
  final_price INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending','confirmed','preparing','ready','completed','cancelled'))
    NOT NULL DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending','paid','refunded'))
    NOT NULL DEFAULT 'pending',
  promo_id UUID,
  estimated_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID, -- Nullable for demo items
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DELIVERY TRACKING ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('assigned','pickup','in_transit','delivered')) NOT NULL DEFAULT 'assigned',
  driver_name TEXT,
  driver_phone TEXT,
  last_lat FLOAT,
  last_lng FLOAT,
  estimated_delivery_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESERVATIONS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_number TEXT UNIQUE NOT NULL,
  business_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  reservation_date DATE NOT NULL,
  reservation_time TEXT NOT NULL, -- e.g. "19:30"
  party_size INTEGER NOT NULL,
  table_preference TEXT,
  special_requests TEXT,
  status TEXT CHECK (status IN ('pending','confirmed','checked_in','completed','cancelled','no_show'))
    NOT NULL DEFAULT 'pending',
  check_in_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROMOTIONS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percent','fixed_amount')) NOT NULL,
  discount_value NUMERIC NOT NULL,
  applicable_to TEXT CHECK (applicable_to IN ('all_orders','delivery_only','dine_in_only','reservation_only'))
    NOT NULL DEFAULT 'all_orders',
  local_id TEXT, -- NULL = all locations
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- NULL = all days
  start_hour INTEGER CHECK (start_hour BETWEEN 0 AND 23),
  end_hour INTEGER CHECK (end_hour BETWEEN 0 AND 23),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIBERS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  birthday DATE,
  preferred_local_id TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'website'
);

-- ─── PROFILES (Auth users) ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin','manager','kitchen','customer')) DEFAULT 'customer',
  preferred_local_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DAILY ANALYTICS (Materialized view candidate) ───────────────────────────

CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  business_id TEXT NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  avg_ticket INTEGER DEFAULT 0,
  delivery_orders INTEGER DEFAULT 0,
  dine_in_orders INTEGER DEFAULT 0,
  reservation_orders INTEGER DEFAULT 0,
  reservation_no_shows INTEGER DEFAULT 0,
  UNIQUE (date, business_id)
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Menu: public read
CREATE POLICY "menu_public_read" ON menu_items FOR SELECT USING (is_active = true);
CREATE POLICY "menu_categories_public_read" ON menu_categories FOR SELECT USING (true);

-- Promotions: public read
CREATE POLICY "promotions_public_read" ON promotions FOR SELECT USING (is_active = true);

-- Orders: customer can see own orders, staff can see all
CREATE POLICY "orders_insert_anon" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_insert_anon" ON order_items FOR INSERT WITH CHECK (true);

-- Reservations: anyone can create
CREATE POLICY "reservations_insert_anon" ON reservations FOR INSERT WITH CHECK (true);

-- Newsletter: anyone can subscribe
CREATE POLICY "subscribers_insert_anon" ON subscribers FOR INSERT WITH CHECK (true);

-- Staff (service_role bypasses RLS for dashboard)

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_business_status ON orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date, business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_menu_items_business ON menu_items(business_id, is_active);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── REALTIME ────────────────────────────────────────────────────────────────
-- Enable realtime on orders and reservations for dashboard live feed
-- Run in Supabase Dashboard > Database > Replication:
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE reservations;

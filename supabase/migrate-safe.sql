-- ─── RISHTEDAR MIGRACIÓN SEGURA ──────────────────────────────────────────────
-- Uso: pegar completo en Supabase Dashboard → SQL Editor → Run
-- Seguro de re-ejecutar: DROP IF EXISTS antes de cada policy,
-- CREATE TABLE IF NOT EXISTS para tablas, CREATE OR REPLACE para funciones.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLAS NUEVAS (no existían en v1) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS loyalty_points (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_phone            TEXT NOT NULL,
  customer_name             TEXT,
  business_id               TEXT NOT NULL,
  points_current            INTEGER DEFAULT 0,
  points_total_historical   INTEGER DEFAULT 0,
  tier                      TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold')),
  total_visits              INTEGER DEFAULT 0,
  favorite_dish             TEXT,
  last_visit_at             TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (customer_phone, business_id)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  business_id    TEXT NOT NULL,
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  points_delta   INTEGER NOT NULL,
  reason         TEXT DEFAULT 'order' CHECK (reason IN ('order','reservation','ranking_prize','manual','redemption')),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_scores (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  customer_name  TEXT NOT NULL,
  business_id    TEXT NOT NULL,
  week_start     DATE NOT NULL,
  score          INTEGER NOT NULL DEFAULT 0,
  is_ranked      BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_weekly_prizes (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id TEXT NOT NULL,
  week_start  DATE NOT NULL,
  rank_1      TEXT DEFAULT '20% descuento',
  rank_2      TEXT DEFAULT '1 postre gratis',
  rank_3      TEXT DEFAULT '10% descuento',
  is_awarded  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, week_start)
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,
  customer_phone TEXT NOT NULL,
  customer_name  TEXT,
  business_id    TEXT NOT NULL,
  description    TEXT NOT NULL,
  discount_type  TEXT DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed','free_item')),
  discount_value NUMERIC,
  valid_until    TIMESTAMPTZ NOT NULL,
  min_items      INTEGER DEFAULT 1,
  is_used        BOOLEAN DEFAULT false,
  used_at        TIMESTAMPTZ,
  order_id       UUID REFERENCES orders(id),
  source         TEXT DEFAULT 'ranking' CHECK (source IN ('ranking','circle','manual')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY — habilitar en tablas nuevas ─────────────────────────

ALTER TABLE loyalty_points       ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_weekly_prizes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes       ENABLE ROW LEVEL SECURITY;

-- ─── POLICIES — DROP IF EXISTS → CREATE ──────────────────────────────────────
-- Tablas existentes (ya tenían policy, borramos y recreamos para tener versión limpia)

DROP POLICY IF EXISTS "businesses_public_read"       ON businesses;
DROP POLICY IF EXISTS "business_hours_public_read"   ON business_hours;
DROP POLICY IF EXISTS "menu_public_read"             ON menu_items;
DROP POLICY IF EXISTS "menu_categories_public_read"  ON menu_categories;
DROP POLICY IF EXISTS "promotions_public_read"       ON promotions;
DROP POLICY IF EXISTS "orders_insert_anon"           ON orders;
DROP POLICY IF EXISTS "order_items_insert_anon"      ON order_items;
DROP POLICY IF EXISTS "reservations_insert_anon"     ON reservations;
DROP POLICY IF EXISTS "subscribers_insert_anon"      ON subscribers;

-- Tablas nuevas
DROP POLICY IF EXISTS "loyalty_insert_anon"          ON loyalty_points;
DROP POLICY IF EXISTS "loyalty_tx_insert_anon"       ON loyalty_transactions;
DROP POLICY IF EXISTS "loyalty_read_by_phone"        ON loyalty_points;
DROP POLICY IF EXISTS "game_scores_insert_anon"      ON game_scores;
DROP POLICY IF EXISTS "game_scores_public_read"      ON game_scores;
DROP POLICY IF EXISTS "game_prizes_public_read"      ON game_weekly_prizes;
DROP POLICY IF EXISTS "discount_codes_read_by_phone" ON discount_codes;

-- Recrear todas
CREATE POLICY "businesses_public_read"       ON businesses           FOR SELECT USING (is_active = true);
CREATE POLICY "business_hours_public_read"   ON business_hours       FOR SELECT USING (true);
CREATE POLICY "menu_public_read"             ON menu_items           FOR SELECT USING (is_active = true);
CREATE POLICY "menu_categories_public_read"  ON menu_categories      FOR SELECT USING (true);
CREATE POLICY "promotions_public_read"       ON promotions           FOR SELECT USING (is_active = true);
CREATE POLICY "orders_insert_anon"           ON orders               FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_insert_anon"      ON order_items          FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_insert_anon"     ON reservations         FOR INSERT WITH CHECK (true);
CREATE POLICY "subscribers_insert_anon"      ON subscribers          FOR INSERT WITH CHECK (true);
CREATE POLICY "loyalty_insert_anon"          ON loyalty_points       FOR INSERT WITH CHECK (true);
CREATE POLICY "loyalty_tx_insert_anon"       ON loyalty_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "loyalty_read_by_phone"        ON loyalty_points       FOR SELECT USING (true);
CREATE POLICY "game_scores_insert_anon"      ON game_scores          FOR INSERT WITH CHECK (true);
CREATE POLICY "game_scores_public_read"      ON game_scores          FOR SELECT USING (true);
CREATE POLICY "game_prizes_public_read"      ON game_weekly_prizes   FOR SELECT USING (true);
CREATE POLICY "discount_codes_read_by_phone" ON discount_codes       FOR SELECT USING (true);

-- ─── ÍNDICES ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_game_scores_week    ON game_scores(business_id, week_start, is_ranked);
CREATE INDEX IF NOT EXISTS idx_loyalty_phone       ON loyalty_points(customer_phone, business_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_phone ON discount_codes(customer_phone, is_used);

-- ─── FUNCIÓN updated_at (CREATE OR REPLACE = seguro re-ejecutar) ─────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Triggers nuevos (solo si no existen)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_loyalty_updated_at') THEN
    CREATE TRIGGER trg_loyalty_updated_at
      BEFORE UPDATE ON loyalty_points FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

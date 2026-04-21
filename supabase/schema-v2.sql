-- ─── RISHTEDAR DATABASE SCHEMA v2 ────────────────────────────────────────────
-- Estado: DOCUMENTADO, no aplicado. Requiere visto bueno del cliente.
-- Última revisión: 2026-04-08
--
-- Cambios respecto a schema v1:
--   + tabla businesses (reemplaza lib/locations.ts hardcodeado)
--   + tabla business_hours (horarios delivery/reservas por sucursal, reemplaza hours_json)
--   + tabla game_scores (ranking semanal del juego)
--   + tabla game_weekly_prizes (premios configurables por admin)
--   + tabla loyalty_points (Circle: puntos y tier por cliente)
--   + tabla discount_codes (premios generados por ranking/Circle)
--   ~ orders: +payment_method, +item_name_snapshot en order_items
--   ~ daily_analytics: candidata a eliminar (reemplazar por queries directas)
--   - tabla daily_analytics: removida (mantenimiento costoso sin beneficio claro en MVP)
--
-- NOTAS DE DISEÑO:
--   - Multitenant: todas las tablas operativas usan business_id (TEXT = slug del local)
--   - Identity del cliente en PWA: localStorage (nombre + teléfono del checkout)
--   - Auth de staff: Supabase Auth con roles (admin, manager, kitchen)
--   - Miami descartada del sistema por ahora (solo página estática)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── BUSINESSES (Locales) ─────────────────────────────────────────────────────
-- Reemplaza lib/locations.ts. Editable desde dashboard admin.

CREATE TABLE IF NOT EXISTS businesses (
  id           TEXT PRIMARY KEY,              -- slug: 'providencia', 'vitacura', etc.
  name         TEXT NOT NULL,                 -- 'Rishtedar Providencia'
  address      TEXT NOT NULL,
  phone        TEXT,
  email        TEXT,
  latitude     FLOAT,
  longitude    FLOAT,
  image_url    TEXT,
  country      TEXT NOT NULL DEFAULT 'CL',   -- 'CL' | 'US'
  is_active    BOOLEAN DEFAULT true,
  is_open_now  BOOLEAN DEFAULT false,         -- override manual (cerrado hoy por excepción)
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BUSINESS HOURS ───────────────────────────────────────────────────────────
-- Horarios independientes para delivery y reservas.
-- Un registro por sucursal + tipo.

CREATE TABLE IF NOT EXISTS business_hours (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type        TEXT CHECK (type IN ('delivery', 'reservations')) NOT NULL,
  -- Por día: active (bool), open (HH:MM), close (HH:MM)
  lun_active  BOOLEAN DEFAULT true,
  lun_open    TEXT DEFAULT '12:00',
  lun_close   TEXT DEFAULT '23:00',
  mar_active  BOOLEAN DEFAULT true,
  mar_open    TEXT DEFAULT '12:00',
  mar_close   TEXT DEFAULT '23:00',
  mie_active  BOOLEAN DEFAULT true,
  mie_open    TEXT DEFAULT '12:00',
  mie_close   TEXT DEFAULT '23:00',
  jue_active  BOOLEAN DEFAULT true,
  jue_open    TEXT DEFAULT '12:00',
  jue_close   TEXT DEFAULT '23:00',
  vie_active  BOOLEAN DEFAULT true,
  vie_open    TEXT DEFAULT '12:30',
  vie_close   TEXT DEFAULT '23:30',
  sab_active  BOOLEAN DEFAULT true,
  sab_open    TEXT DEFAULT '12:30',
  sab_close   TEXT DEFAULT '23:30',
  dom_active  BOOLEAN DEFAULT true,
  dom_open    TEXT DEFAULT '12:30',
  dom_close   TEXT DEFAULT '22:30',
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, type)
);

-- ─── MENU ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS menu_categories (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id TEXT NOT NULL,                 -- NULL = todas las sucursales
  name        TEXT NOT NULL,
  "order"     INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id  UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  business_id  TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  price        INTEGER NOT NULL,             -- CLP como entero
  image_url    TEXT,
  is_active    BOOLEAN DEFAULT true,
  dietary_tags TEXT[] DEFAULT '{}',          -- 'vegetarian','vegan','gluten-free','spicy'
  allergens    TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROMOTIONS ───────────────────────────────────────────────────────────────
-- Definida antes de orders porque orders.promo_id la referencia.

CREATE TABLE IF NOT EXISTS promotions (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT,
  discount_type    TEXT CHECK (discount_type IN ('percent','fixed_amount')) NOT NULL,
  discount_value   NUMERIC NOT NULL,
  applicable_to    TEXT CHECK (applicable_to IN ('all_orders','delivery_only','dine_in_only','reservation_only'))
                   NOT NULL DEFAULT 'all_orders',
  business_id      TEXT,                    -- NULL = todos los locales
  valid_from       DATE NOT NULL,
  valid_to         DATE NOT NULL,
  day_of_week      INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- NULL = todos los días
  start_hour       INTEGER CHECK (start_hour BETWEEN 0 AND 23),
  end_hour         INTEGER CHECK (end_hour BETWEEN 0 AND 23),
  is_active        BOOLEAN DEFAULT true,
  usage_count      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  -- ── Banner visual (opcional) ──────────────────────────────────────────────
  -- Cuando show_as_banner=true, la promoción aparece como pop-up en el sitio
  show_as_banner   BOOLEAN DEFAULT false,
  image_url        TEXT,
  font_family      TEXT DEFAULT 'Yatra One',
  font_size        INTEGER DEFAULT 28,
  text_color       TEXT DEFAULT '#ffffff',
  background_color TEXT DEFAULT '#91226f',
  overlay_opacity  INTEGER DEFAULT 60,  -- 0=imagen pura, 100=color sólido
  banner_padding   INTEGER DEFAULT 24,
  border_radius    INTEGER DEFAULT 8
);

-- ─── PROMOTIONAL BANNERS (Pop-ups personalizables) ────────────────────────────
-- Banners visuales con tipografía y colores personalizables para pop-ups

CREATE TABLE IF NOT EXISTS promotional_banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  font_family TEXT DEFAULT 'Poppins',
  font_size INTEGER DEFAULT 24,
  text_color TEXT DEFAULT '#000000',
  background_color TEXT DEFAULT '#ffffff',
  padding INTEGER DEFAULT 20,
  border_radius INTEGER DEFAULT 8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE promotional_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_banners" ON promotional_banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "admin_manage_banners" ON promotional_banners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_banners_active ON promotional_banners(is_active);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number         TEXT UNIQUE NOT NULL,
  business_id          TEXT NOT NULL,
  customer_name        TEXT NOT NULL,
  customer_phone       TEXT NOT NULL,
  customer_email       TEXT,
  delivery_address     TEXT,
  delivery_latitude    FLOAT,
  delivery_longitude   FLOAT,
  order_type           TEXT CHECK (order_type IN ('dine_in','takeaway','delivery')) NOT NULL,
  items_count          INTEGER NOT NULL DEFAULT 0,
  subtotal             INTEGER NOT NULL,
  discount_applied     INTEGER NOT NULL DEFAULT 0,
  final_price          INTEGER NOT NULL,
  status               TEXT CHECK (status IN ('pending','confirmed','preparing','ready','completed','cancelled'))
                       NOT NULL DEFAULT 'pending',
  payment_status       TEXT CHECK (payment_status IN ('pending','paid','refunded'))
                       NOT NULL DEFAULT 'pending',
  payment_method       TEXT,                -- 'mercadopago' | 'stripe' | 'cash' | etc. (define cliente)
  promo_id             UUID REFERENCES promotions(id),
  estimated_delivery_at TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id             UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id         UUID,                -- nullable para ítems del demo
  item_name            TEXT NOT NULL,       -- SNAPSHOT del nombre al momento de compra
  quantity             INTEGER NOT NULL DEFAULT 1,
  unit_price           INTEGER NOT NULL,
  special_instructions TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DELIVERY TRACKING ────────────────────────────────────────────────────────
-- Usado por la PWA del cliente: 2 estados visibles (preparing → on_the_way)

CREATE TABLE IF NOT EXISTS delivery_tracking (
  id                     UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id               UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  -- Estado visible al cliente
  client_status          TEXT CHECK (client_status IN ('preparing','on_the_way','delivered'))
                         NOT NULL DEFAULT 'preparing',
  -- Info del driver (cuando aplica)
  driver_name            TEXT,
  driver_phone           TEXT,
  estimated_delivery_time TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESERVATIONS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reservations (
  id                 UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_number TEXT UNIQUE NOT NULL,
  business_id        TEXT NOT NULL,
  customer_name      TEXT NOT NULL,
  customer_phone     TEXT NOT NULL,
  customer_email     TEXT,
  reservation_date   DATE NOT NULL,
  reservation_time   TEXT NOT NULL,         -- '19:30'
  party_size         INTEGER NOT NULL,
  table_preference   TEXT,
  special_requests   TEXT,
  status             TEXT CHECK (status IN ('pending','confirmed','checked_in','completed','cancelled','no_show'))
                     NOT NULL DEFAULT 'pending',
  check_in_time      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIBERS (Newsletter) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscribers (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email               TEXT UNIQUE NOT NULL,
  first_name          TEXT,
  birthday            DATE,
  preferred_local_id  TEXT,
  subscribed_at       TIMESTAMPTZ DEFAULT NOW(),
  is_active           BOOLEAN DEFAULT true,
  source              TEXT DEFAULT 'website'
);

-- ─── PROFILES (Staff con Supabase Auth) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,
  phone               TEXT,
  full_name           TEXT,
  role                TEXT CHECK (role IN ('admin','manager','kitchen')) DEFAULT 'kitchen',
  business_id         TEXT,                -- NULL = acceso admin global
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LOYALTY POINTS (Circle) ─────────────────────────────────────────────────
-- Vinculado por teléfono (identity del cliente en la PWA = localStorage)
-- No requiere auth del cliente

CREATE TABLE IF NOT EXISTS loyalty_points (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_phone          TEXT NOT NULL,
  customer_name           TEXT,
  business_id             TEXT NOT NULL,   -- puntos por sucursal o global (TBD)
  points_current          INTEGER DEFAULT 0,
  points_total_historical INTEGER DEFAULT 0,
  tier                    TEXT CHECK (tier IN ('bronze','silver','gold')) DEFAULT 'bronze',
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (customer_phone, business_id)
);

-- Cada vez que se suma puntos (por pedido confirmado)
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  business_id    TEXT NOT NULL,
  order_id       UUID REFERENCES orders(id),
  points_delta   INTEGER NOT NULL,          -- positivo = ganó, negativo = canjeó
  reason         TEXT,                      -- 'order', 'ranking_prize', 'manual'
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LOYALTY CONFIG ──────────────────────────────────────────────────────────
-- Fila única con la configuración editable del programa Circle.
-- earn_rules, prizes y tier_benefits son JSONB para permitir edición
-- desde el dashboard sin migraciones adicionales.

CREATE TABLE IF NOT EXISTS loyalty_config (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  earn_rules    JSONB NOT NULL DEFAULT '[]'::jsonb,
  prizes        JSONB NOT NULL DEFAULT '[]'::jsonb,
  tier_benefits JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GAME SCORES ─────────────────────────────────────────────────────────────
-- Ranking semanal del juego (Pac-Man adaptado)
-- Semana = lunes 00:00 a domingo 23:59 (week_start = fecha del lunes)

CREATE TABLE IF NOT EXISTS game_scores (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  customer_name  TEXT,
  business_id    TEXT NOT NULL,
  score          INTEGER NOT NULL,
  week_start     DATE NOT NULL,            -- lunes de la semana
  is_ranked      BOOLEAN DEFAULT false,    -- true = el cliente eligió que contara
  game_tokens_used INTEGER DEFAULT 1,     -- fichas usadas (3 max/semana)
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GAME WEEKLY PRIZES ───────────────────────────────────────────────────────
-- El admin del local define el premio de cada semana

CREATE TABLE IF NOT EXISTS game_weekly_prizes (
  id                 UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id        TEXT NOT NULL,
  week_start         DATE NOT NULL,
  -- Premio para top 1, 2, 3 (texto libre + descuento)
  prize_1_desc       TEXT NOT NULL DEFAULT '15% de descuento',
  prize_1_discount   INTEGER DEFAULT 15,  -- porcentaje
  prize_2_desc       TEXT NOT NULL DEFAULT '10% de descuento',
  prize_2_discount   INTEGER DEFAULT 10,
  prize_3_desc       TEXT NOT NULL DEFAULT '5% de descuento',
  prize_3_discount   INTEGER DEFAULT 5,
  valid_days         INTEGER DEFAULT 7,   -- días de validez del cupón
  min_order_items    INTEGER DEFAULT 1,   -- mínimo de ítems para usar el cupón
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, week_start)
);

-- ─── DISCOUNT CODES ──────────────────────────────────────────────────────────
-- Generados automáticamente al terminar la semana de ranking

CREATE TABLE IF NOT EXISTS discount_codes (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,     -- ej: 'RANK1-PRV-0414'
  customer_phone TEXT NOT NULL,
  business_id    TEXT NOT NULL,
  discount_pct   INTEGER NOT NULL,
  valid_until    TIMESTAMPTZ NOT NULL,
  min_items      INTEGER DEFAULT 1,
  is_used        BOOLEAN DEFAULT false,
  used_at        TIMESTAMPTZ,
  order_id       UUID REFERENCES orders(id),
  source         TEXT DEFAULT 'ranking',  -- 'ranking' | 'circle' | 'manual'
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_weekly_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "businesses_public_read"      ON businesses      FOR SELECT USING (is_active = true);
CREATE POLICY "business_hours_public_read"  ON business_hours  FOR SELECT USING (true);
CREATE POLICY "menu_public_read"            ON menu_items      FOR SELECT USING (is_active = true);
CREATE POLICY "menu_categories_public_read" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "promotions_public_read"      ON promotions      FOR SELECT USING (is_active = true);

-- Inserción anónima (clientes sin auth)
CREATE POLICY "orders_insert_anon"          ON orders          FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_insert_anon"     ON order_items     FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_insert_anon"    ON reservations    FOR INSERT WITH CHECK (true);
CREATE POLICY "subscribers_insert_anon"     ON subscribers     FOR INSERT WITH CHECK (true);
CREATE POLICY "loyalty_insert_anon"         ON loyalty_points  FOR INSERT WITH CHECK (true);
CREATE POLICY "loyalty_tx_insert_anon"      ON loyalty_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "game_scores_insert_anon"     ON game_scores     FOR INSERT WITH CHECK (true);

-- Lectura por teléfono (PWA cliente, sin auth)
CREATE POLICY "loyalty_read_by_phone"       ON loyalty_points  FOR SELECT USING (true);
CREATE POLICY "game_scores_public_read"     ON game_scores     FOR SELECT USING (true);
CREATE POLICY "game_prizes_public_read"     ON game_weekly_prizes FOR SELECT USING (true);
CREATE POLICY "discount_codes_read_by_phone" ON discount_codes FOR SELECT USING (true);

-- Staff: service_role bypasa RLS para el dashboard
-- (Usar createAdminClient() en las API routes del dashboard)

-- ─── ÍNDICES ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_business_status ON orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date, business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_menu_items_business ON menu_items(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_game_scores_week ON game_scores(business_id, week_start, is_ranked);
CREATE INDEX IF NOT EXISTS idx_loyalty_phone ON loyalty_points(customer_phone, business_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_phone ON discount_codes(customer_phone, is_used);

-- ─── TRIGGERS updated_at ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_delivery_updated_at
  BEFORE UPDATE ON delivery_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_loyalty_updated_at
  BEFORE UPDATE ON loyalty_points FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── REALTIME ─────────────────────────────────────────────────────────────────
-- Habilitar en Supabase Dashboard > Database > Replication:
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE delivery_tracking;
-- ALTER PUBLICATION supabase_realtime ADD TABLE game_scores;

-- ─── LÓGICA DE FICHAS DEL JUEGO ───────────────────────────────────────────────
-- (No en DB — calculado en el cliente y validado en API)
-- Regla: 3 fichas rankeadas por semana (week_start)
-- Para contar fichas disponibles:
--   SELECT COUNT(*) FROM game_scores
--   WHERE customer_phone = $1
--     AND business_id = $2
--     AND week_start = $3
--     AND is_ranked = true
--   → si COUNT < 3, puede rankear
-- Práctica: ilimitada (is_ranked = false, no consume ficha)

-- ─── LÓGICA DE TIER CIRCLE ────────────────────────────────────────────────────
-- bronze: 0 – 999 puntos históricos
-- silver: 1.000 – 4.999
-- gold:   5.000+
-- Se recalcula en cada UPDATE de loyalty_points.

-- ─── NOTAS STORAGE ────────────────────────────────────────────────────────────
-- Buckets a crear cuando cliente apruebe:
--   'menu-images'    → imágenes de platos (public read, staff write)
--   'location-images'→ fotos de locales (public read, admin write)
--   'staff-uploads'  → material interno (private)
-- Estructura: {bucket}/{business_id}/{filename}

-- ─── ANALYTICS + CARTS MIGRATION ────────────────────────────────────────────
-- Para el dashboard de KPIs del cliente.
-- Aplicar en: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── ANALYTICS SESSIONS ──────────────────────────────────────────────────────
-- Un registro por visita (30 min inactividad = nueva sesión).

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  visitor_id    TEXT NOT NULL,              -- cookie 2 años, persiste entre sesiones
  session_id    TEXT NOT NULL UNIQUE,       -- UUID nuevo por sesión
  business_id   TEXT REFERENCES businesses(id) ON DELETE SET NULL,
  landing_page  TEXT,                       -- primera página visitada
  referrer      TEXT,                       -- document.referrer
  utm_source    TEXT,                       -- google, instagram, tiktok, etc.
  utm_medium    TEXT,                       -- cpc, organic, email, etc.
  utm_campaign  TEXT,
  utm_content   TEXT,
  device        TEXT,                       -- 'mobile' | 'tablet' | 'desktop'
  country       TEXT DEFAULT 'CL',
  converted     BOOLEAN DEFAULT false,      -- hizo purchase o reservation
  conversion_type TEXT,                     -- 'order' | 'reservation' | null
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  ended_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_business ON analytics_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON analytics_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON analytics_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_source ON analytics_sessions(utm_source);

-- ─── ANALYTICS EVENTS ────────────────────────────────────────────────────────
-- Eventos del funnel por sesión.

CREATE TABLE IF NOT EXISTS analytics_events (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
  business_id TEXT REFERENCES businesses(id) ON DELETE SET NULL,
  event_name  TEXT NOT NULL,  -- page_view | view_menu | add_to_cart | remove_from_cart |
                              -- begin_checkout | purchase | reservation_started |
                              -- reservation_completed | lead_captured
  payload     JSONB,          -- datos adicionales: {item_id, item_name, price, quantity}
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_business ON analytics_events(business_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created ON analytics_events(created_at);

-- ─── CARTS ───────────────────────────────────────────────────────────────────
-- Carritos backend para detectar abandono.

CREATE TABLE IF NOT EXISTS carts (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id    TEXT REFERENCES analytics_sessions(session_id) ON DELETE SET NULL,
  business_id   TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  visitor_id    TEXT NOT NULL,
  items         JSONB DEFAULT '[]',         -- snapshot del carrito
  subtotal      NUMERIC(10,2) DEFAULT 0,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),
  abandoned_at  TIMESTAMPTZ,               -- set por job cuando > 30 min sin actividad
  converted_at  TIMESTAMPTZ,               -- set al confirmar purchase
  order_id      UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_business ON carts(business_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
CREATE INDEX IF NOT EXISTS idx_carts_visitor ON carts(visitor_id);
CREATE INDEX IF NOT EXISTS idx_carts_updated ON carts(updated_at);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Solo service role puede escribir analytics (desde API routes).
-- Staff autenticado puede leer para el dashboard.

ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts               ENABLE ROW LEVEL SECURITY;

-- Service role bypasa RLS — no necesita políticas explícitas para escribir.
-- Lectura para staff autenticado:
CREATE POLICY "staff_read_sessions" ON analytics_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "staff_read_events" ON analytics_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "staff_read_carts" ON carts
  FOR SELECT TO authenticated USING (true);

-- ─── RISHTEDAR MIGRACIÓN v2 ───────────────────────────────────────────────────
-- Aplicar DESPUÉS de migrate-safe.sql
-- Seguro de re-ejecutar: ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. COLUMNAS FALTANTES EN loyalty_points ─────────────────────────────────
-- migrate-safe.sql las define en CREATE TABLE IF NOT EXISTS, pero si la tabla
-- ya existía antes de esa migración, las columnas no se agregaron.

ALTER TABLE loyalty_points
  ADD COLUMN IF NOT EXISTS total_visits            INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visit_at           TIMESTAMPTZ;

-- ─── 2. COLUMNAS FALTANTES EN loyalty_transactions ───────────────────────────

ALTER TABLE loyalty_transactions
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ─── 3. TABLA push_subscriptions ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  endpoint       TEXT NOT NULL UNIQUE,
  keys_p256dh    TEXT NOT NULL,
  keys_auth      TEXT NOT NULL,
  customer_phone TEXT,
  business_id    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_insert_anon"  ON push_subscriptions;
DROP POLICY IF EXISTS "push_update_anon"  ON push_subscriptions;

-- anon puede insertar (suscribirse) y actualizar (renovar endpoint)
CREATE POLICY "push_insert_anon" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "push_update_anon" ON push_subscriptions FOR UPDATE USING (true);

-- ─── 4. TABLA drivers (si no existe aún) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS drivers (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT,
  vehicle     TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drivers_read_anon"   ON drivers;
DROP POLICY IF EXISTS "drivers_insert_anon" ON drivers;

CREATE POLICY "drivers_read_anon"   ON drivers FOR SELECT USING (true);
CREATE POLICY "drivers_insert_anon" ON drivers FOR INSERT WITH CHECK (true);

-- ─── 5. ÍNDICES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_push_subs_phone      ON push_subscriptions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_push_subs_business   ON push_subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_visits       ON loyalty_points(customer_phone, business_id, total_visits);

-- ─── 6. STORAGE BUCKET delivery-photos ───────────────────────────────────────
-- No se puede crear via SQL. Hacerlo manualmente:
-- Supabase Dashboard → Storage → New Bucket → Name: "delivery-photos" → Public: OFF
-- Luego agregar policy:
--   INSERT: role = anon, WITH CHECK (true)
--   SELECT: role = service_role (solo backend)

-- ─── FIN v2 ───────────────────────────────────────────────────────────────────

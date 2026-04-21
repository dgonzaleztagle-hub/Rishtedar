-- ─── DELIVERY FLOW MIGRATION ─────────────────────────────────────────────────
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Seguro de re-ejecutar: usa IF NOT EXISTS / DO $$ en todas las operaciones
-- Fecha: 2026-04-14
--
-- Cubre gaps detectados para flujo E2E de delivery:
--   1. Columna zone en tabla drivers (falta en migrate-v2.sql)
--   2. Columnas driver_id, driver_token, delivery_photo_url en delivery_tracking
--   3. UNIQUE constraint en delivery_tracking.order_id (requerido por upsert)
--   4. RLS policies completas para drivers
--   5. Índices para queries del dashboard
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. DRIVERS: agregar columnas faltantes ───────────────────────────────────
-- migrate-v2.sql creó la tabla sin zone. La agregamos idempotente.

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS zone       TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Asegurar que phone es NOT NULL (migrate-v2.sql lo dejó nullable)
-- Solo aplica si hay filas con phone NULL — de lo contrario es no-op
UPDATE drivers SET phone = '' WHERE phone IS NULL;

-- ─── 2. DELIVERY_TRACKING: columnas para flujo driver ────────────────────────

ALTER TABLE delivery_tracking
  ADD COLUMN IF NOT EXISTS driver_id          UUID REFERENCES drivers(id),
  ADD COLUMN IF NOT EXISTS driver_token       TEXT,
  ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;

-- ─── 3. UNIQUE constraint en delivery_tracking.order_id ──────────────────────
-- Requerido por upsert({ onConflict: 'order_id' }) en /api/delivery/assign
-- El DO $$ block evita error si ya existe

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'delivery_tracking_order_id_unique'
      AND conrelid = 'delivery_tracking'::regclass
  ) THEN
    ALTER TABLE delivery_tracking
      ADD CONSTRAINT delivery_tracking_order_id_unique UNIQUE (order_id);
  END IF;
END $$;

-- ─── 4. UNIQUE constraint en delivery_tracking.driver_token ──────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'delivery_tracking_driver_token_unique'
      AND conrelid = 'delivery_tracking'::regclass
  ) THEN
    ALTER TABLE delivery_tracking
      ADD CONSTRAINT delivery_tracking_driver_token_unique UNIQUE (driver_token);
  END IF;
END $$;

-- ─── 5. RLS POLICIES para drivers ────────────────────────────────────────────
-- service_role bypasa RLS automáticamente (usado en admin client)
-- Lectura pública para que el driver slice funcione sin auth

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drivers_read_all"   ON drivers;
DROP POLICY IF EXISTS "drivers_insert_all" ON drivers;
DROP POLICY IF EXISTS "drivers_update_all" ON drivers;
DROP POLICY IF EXISTS "drivers_read_anon"  ON drivers;
DROP POLICY IF EXISTS "drivers_insert_anon" ON drivers;

CREATE POLICY "drivers_read_all"   ON drivers FOR SELECT USING (true);
CREATE POLICY "drivers_insert_all" ON drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "drivers_update_all" ON drivers FOR UPDATE USING (true) WITH CHECK (true);

-- ─── 6. ÍNDICES para performance ─────────────────────────────────────────────

-- Dashboard delivery: query principal
CREATE INDEX IF NOT EXISTS idx_orders_delivery_dashboard
  ON orders (business_id, order_type, status, created_at DESC)
  WHERE order_type = 'delivery';

-- Token lookup (app del repartidor)
CREATE INDEX IF NOT EXISTS idx_delivery_token
  ON delivery_tracking (driver_token)
  WHERE driver_token IS NOT NULL;

-- Driver lookup
CREATE INDEX IF NOT EXISTS idx_delivery_driver_id
  ON delivery_tracking (driver_id)
  WHERE driver_id IS NOT NULL;

-- Drivers por sucursal
CREATE INDEX IF NOT EXISTS idx_drivers_business
  ON drivers (business_id, is_active);

-- ─── 7. STORAGE BUCKET delivery-photos ───────────────────────────────────────
-- No se puede crear via SQL. Hacer manualmente:
--   Supabase Dashboard → Storage → New Bucket
--     Nombre:   delivery-photos
--     Público:  true  (permite getPublicUrl sin auth)
--     Max size: 5 MB
--     MIME:     image/jpeg, image/png, image/webp
--
-- Luego agregar políticas:
--   INSERT: authenticated = false (anon puede subir desde app del repartidor)
--   SELECT: public = true

-- ─── FIN ─────────────────────────────────────────────────────────────────────
-- Verificar con:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'delivery_tracking' ORDER BY column_name;
--
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'drivers' ORDER BY column_name;

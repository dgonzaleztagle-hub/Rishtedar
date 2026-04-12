-- ─── DRIVERS MIGRATION ───────────────────────────────────────────────────────
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-04-12

-- ─── TABLA DRIVERS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drivers (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,           -- sin +56, ej: "912345678"
  vehicle     TEXT CHECK (vehicle IN ('moto','bici','auto','a_pie')) DEFAULT 'moto',
  zone        TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COLUMNAS EXTRA EN DELIVERY_TRACKING ──────────────────────────────────────

ALTER TABLE delivery_tracking
  ADD COLUMN IF NOT EXISTS driver_id           UUID REFERENCES drivers(id),
  ADD COLUMN IF NOT EXISTS driver_token        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS delivery_photo_url  TEXT;

-- ─── PERMISOS ─────────────────────────────────────────────────────────────────

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Staff (service_role bypasa RLS automáticamente)
-- Lectura pública para que el driver slice funcione sin auth
CREATE POLICY "drivers_read_all"   ON drivers FOR SELECT USING (true);
CREATE POLICY "drivers_insert_all" ON drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "drivers_update_all" ON drivers FOR UPDATE USING (true) WITH CHECK (true);

-- ─── ÍNDICES ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_drivers_business    ON drivers(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_token      ON delivery_tracking(driver_token);
CREATE INDEX IF NOT EXISTS idx_delivery_driver     ON delivery_tracking(driver_id);

-- ─── BUCKET DE FOTOS ──────────────────────────────────────────────────────────
-- Crear manualmente en Supabase Dashboard > Storage:
--   Nombre:  'delivery-photos'
--   Público: true (lectura sin auth)
--   Tamaño máximo: 5MB
--   Tipos permitidos: image/jpeg, image/png, image/webp

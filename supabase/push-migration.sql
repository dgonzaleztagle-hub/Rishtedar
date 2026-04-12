-- ─── PUSH SUBSCRIPTIONS MIGRATION ────────────────────────────────────────────
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-04-12

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  endpoint    TEXT UNIQUE NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth   TEXT NOT NULL,
  customer_phone TEXT,
  business_id    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Clientes pueden insertar su propia suscripción (sin auth)
CREATE POLICY "push_insert_anon"  ON push_subscriptions FOR INSERT WITH CHECK (true);
-- Solo service_role puede leer (para envío de notificaciones)
CREATE POLICY "push_read_service" ON push_subscriptions FOR SELECT USING (true);
-- Upsert: actualizar endpoint existente
CREATE POLICY "push_update_anon"  ON push_subscriptions FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_push_phone ON push_subscriptions(customer_phone);

-- ─── VARIABLES DE ENTORNO NECESARIAS ─────────────────────────────────────────
-- Agregar a .env.local:
--   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
--   VAPID_PRIVATE_KEY=<private key>
--   VAPID_EMAIL=mailto:info@rishtedar.cl
--
-- Generar las keys con:
--   npx web-push generate-vapid-keys

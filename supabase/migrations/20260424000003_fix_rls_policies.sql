-- Cierra políticas RLS demasiado permisivas
-- Regla: writes van SIEMPRE por API (service_role). Anon nunca escribe directamente.

-- ── loyalty_points ────────────────────────────────────────────────────────────
-- INSERT público permite crear puntos falsos sin pasar por la API
DROP POLICY IF EXISTS "loyalty_insert_anon" ON loyalty_points;

-- ── loyalty_transactions ──────────────────────────────────────────────────────
-- INSERT público permite crear transacciones falsas
DROP POLICY IF EXISTS "loyalty_tx_insert_anon" ON loyalty_transactions;

-- ── drivers ───────────────────────────────────────────────────────────────────
-- INSERT/UPDATE público permite registrar conductores falsos
DROP POLICY IF EXISTS "drivers_insert_all" ON drivers;
DROP POLICY IF EXISTS "drivers_update_all" ON drivers;

-- ── location_hours ────────────────────────────────────────────────────────────
-- ALL público permite que cualquiera cambie horarios del local
DROP POLICY IF EXISTS "admin_write_hours" ON location_hours;

-- Reemplazar con política que solo permita escritura via service_role (APIs)
-- service_role bypasea RLS por defecto, así que no necesita policy explícita.
-- Solo dejamos la lectura autenticada.

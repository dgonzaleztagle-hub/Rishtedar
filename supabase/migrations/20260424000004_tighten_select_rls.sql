-- Cierra SELECT público en tablas con PII o datos sensibles.
-- Todos los reads van por API (service_role), no hay flujo legítimo via anon key.

-- loyalty_points: expone teléfono, nombre, puntos
DROP POLICY IF EXISTS "loyalty_read_by_phone" ON loyalty_points;

-- discount_codes: expone códigos y teléfonos (tabla no usada actualmente por código)
DROP POLICY IF EXISTS "discount_codes_read_by_phone" ON discount_codes;

-- drivers: expone nombres y teléfonos de conductores
DROP POLICY IF EXISTS "drivers_read_all" ON drivers;

-- game_scores: legacy, contiene teléfono/nombre
DROP POLICY IF EXISTS "game_scores_public_read" ON game_scores;

-- branch_scanner_tokens: tokens de seguridad — solo service_role debe leer
DROP POLICY IF EXISTS "staff can read scanner tokens" ON branch_scanner_tokens;

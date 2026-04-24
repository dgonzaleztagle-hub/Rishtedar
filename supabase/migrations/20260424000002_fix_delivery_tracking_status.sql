-- Actualiza el constraint de delivery_tracking.status para alinear con el código
-- El código usa: assigned, pickup, in_transit, delivered
-- La BD tenía: preparing, on_the_way, delivered (no coincidía)

ALTER TABLE delivery_tracking DROP CONSTRAINT IF EXISTS delivery_tracking_client_status_check;

ALTER TABLE delivery_tracking
  ADD CONSTRAINT delivery_tracking_status_check
  CHECK (status IN ('assigned', 'pickup', 'in_transit', 'delivered'));

-- Migrar filas existentes que usen los valores viejos
UPDATE delivery_tracking SET status = 'assigned'   WHERE status = 'preparing';
UPDATE delivery_tracking SET status = 'in_transit' WHERE status = 'on_the_way';

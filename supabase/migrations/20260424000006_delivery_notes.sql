-- Notas de entrega: cliente al pedir, driver durante entrega

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_note TEXT;

ALTER TABLE delivery_tracking
  ADD COLUMN IF NOT EXISTS driver_note TEXT;

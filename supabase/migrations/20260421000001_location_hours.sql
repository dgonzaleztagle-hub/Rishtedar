-- location_hours: horarios de delivery y reservas por local
-- Una fila por (business_id, type). Se upsert cada vez que admin guarda.

CREATE TABLE IF NOT EXISTS location_hours (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text    NOT NULL,
  type        text    NOT NULL CHECK (type IN ('delivery', 'reservations')),
  schedule    jsonb   NOT NULL DEFAULT '{}',
  is_open     boolean NOT NULL DEFAULT true,
  updated_at  timestamptz DEFAULT now(),

  UNIQUE (business_id, type)
);

-- Solo admins pueden leer y escribir
ALTER TABLE location_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_hours" ON location_hours
  FOR SELECT USING (true);

CREATE POLICY "admin_write_hours" ON location_hours
  FOR ALL USING (true);

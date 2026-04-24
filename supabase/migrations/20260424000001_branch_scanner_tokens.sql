-- Tokens de scanner por sucursal
-- Permite rotar tokens desde el dashboard sin redeploy

CREATE TABLE IF NOT EXISTS branch_scanner_tokens (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  branch_id  TEXT NOT NULL UNIQUE,
  token      TEXT NOT NULL,
  rotated_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE branch_scanner_tokens ENABLE ROW LEVEL SECURITY;

-- Solo staff autenticado puede leer
CREATE POLICY "staff can read scanner tokens"
  ON branch_scanner_tokens FOR SELECT
  TO authenticated
  USING (true);

-- Solo service role puede insertar/actualizar (via API con admin client)
-- No se expone escritura directa a usuarios autenticados

-- Seed: insertar tokens actuales (los generados el 2026-04-24)
INSERT INTO branch_scanner_tokens (branch_id, token) VALUES
  ('providencia', 'b38c568796e493528a1b667f726a87aecdc6060e11c0c661'),
  ('vitacura',    'c67c39621860c17717b6dfbc426f0be485641ca8e64116dd'),
  ('la-reina',    '7d568106e98cb312730111c680ffc3952bc407ccb97b8ee7'),
  ('la-dehesa',   '5e610acd584ebaf6cf6bb697d4709835e7dfd17a96c349b8'),
  ('admin',       'cb0f0b3a19aaf089070af86dde1ed7a13269dec4a9038b77')
ON CONFLICT (branch_id) DO NOTHING;

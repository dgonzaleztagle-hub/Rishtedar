-- Habilita RLS en tablas que lo tenían apagado.
-- Las policies ya existían pero eran ignoradas con RLS off.

ALTER TABLE analytics_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_config     ENABLE ROW LEVEL SECURITY;

-- loyalty_config no tenía policies — agregar lectura para autenticados.
-- Escritura solo via service_role (APIs con admin client).
CREATE POLICY "authenticated_read_loyalty_config"
  ON loyalty_config FOR SELECT
  TO authenticated
  USING (true);

-- game_score_submissions: DROP SELECT público que expone customer_phone/name
DROP POLICY IF EXISTS "public_read_scores"      ON game_score_submissions;
DROP POLICY IF EXISTS "game_scores_public_read"  ON game_score_submissions;
DROP POLICY IF EXISTS "anyone_read_scores"       ON game_score_submissions;

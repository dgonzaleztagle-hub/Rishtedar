-- Game ranking credits and weekly prize audit trail.
-- Orders will call grant_game_score_credits(..., 3) once the order flow is finalized.

CREATE TABLE IF NOT EXISTS game_score_credits (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_phone  TEXT NOT NULL,
  customer_name   TEXT,
  business_id     TEXT NOT NULL,
  week_start      DATE NOT NULL,
  source_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  credits_granted INTEGER NOT NULL DEFAULT 3,
  credits_used    INTEGER NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CHECK (credits_granted > 0),
  CHECK (credits_used >= 0),
  CHECK (credits_used <= credits_granted)
);

CREATE TABLE IF NOT EXISTS game_score_submissions (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  customer_name  TEXT,
  display_name   TEXT NOT NULL,
  business_id    TEXT NOT NULL,
  week_start     DATE NOT NULL,
  score          INTEGER NOT NULL,
  credit_id      UUID REFERENCES game_score_credits(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  CHECK (score >= 0)
);

CREATE TABLE IF NOT EXISTS game_weekly_winners (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id    TEXT NOT NULL,
  week_start     DATE NOT NULL,
  rank           INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
  customer_phone TEXT NOT NULL,
  display_name   TEXT NOT NULL,
  score          INTEGER NOT NULL,
  submission_id  UUID REFERENCES game_score_submissions(id) ON DELETE SET NULL,
  closed_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, week_start, rank),
  UNIQUE (business_id, week_start, customer_phone)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_game_score_credits_source_order
  ON game_score_credits(source_order_id)
  WHERE source_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_game_score_credits_lookup
  ON game_score_credits(customer_phone, business_id, week_start, expires_at);

CREATE INDEX IF NOT EXISTS idx_game_score_submissions_week
  ON game_score_submissions(business_id, week_start, score DESC);

CREATE INDEX IF NOT EXISTS idx_game_weekly_winners_lookup
  ON game_weekly_winners(business_id, week_start, rank);

ALTER TABLE game_score_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_score_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_weekly_winners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_scores_insert_anon" ON game_scores;
DROP POLICY IF EXISTS "game_submissions_public_read" ON game_score_submissions;
DROP POLICY IF EXISTS "game_winners_public_read" ON game_weekly_winners;

CREATE POLICY "game_submissions_public_read"
  ON game_score_submissions FOR SELECT USING (true);

CREATE POLICY "game_winners_public_read"
  ON game_weekly_winners FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $update_updated_at$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$update_updated_at$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_game_score_credits_updated_at ON game_score_credits;
CREATE TRIGGER trg_game_score_credits_updated_at
  BEFORE UPDATE ON game_score_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION public.game_display_name(p_name TEXT, p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $game_display_name$
DECLARE
  v_name TEXT := NULLIF(BTRIM(COALESCE(p_name, '')), '');
  v_phone TEXT := REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g');
  v_parts TEXT[];
BEGIN
  IF v_name IS NULL THEN
    RETURN 'Jugador ' || COALESCE(NULLIF(RIGHT(v_phone, 4), ''), 'Circle');
  END IF;

  v_parts := REGEXP_SPLIT_TO_ARRAY(v_name, '\s+');

  IF ARRAY_LENGTH(v_parts, 1) >= 2 THEN
    RETURN INITCAP(v_parts[1]) || ' ' || UPPER(LEFT(v_parts[2], 1)) || '.';
  END IF;

  RETURN INITCAP(v_parts[1]);
END;
$game_display_name$;

CREATE OR REPLACE FUNCTION public.grant_game_score_credits(
  p_customer_phone TEXT,
  p_customer_name TEXT,
  p_business_id TEXT,
  p_source_order_id UUID,
  p_week_start DATE DEFAULT NULL,
  p_credits INTEGER DEFAULT 3
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $grant_game_score_credits$
DECLARE
  v_existing_id UUID;
  v_credit_id UUID;
  v_week_start DATE := COALESCE(p_week_start, DATE_TRUNC('week', NOW())::DATE);
BEGIN
  IF p_customer_phone IS NULL OR p_business_id IS NULL OR p_credits <= 0 THEN
    RAISE EXCEPTION 'INVALID_GAME_CREDIT_GRANT' USING ERRCODE = '22023';
  END IF;

  IF p_source_order_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM game_score_credits
    WHERE source_order_id = p_source_order_id
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
  END IF;

  INSERT INTO game_score_credits (
    customer_phone,
    customer_name,
    business_id,
    week_start,
    source_order_id,
    credits_granted,
    expires_at
  )
  VALUES (
    p_customer_phone,
    p_customer_name,
    p_business_id,
    v_week_start,
    p_source_order_id,
    p_credits,
    (v_week_start + INTERVAL '7 days')::TIMESTAMPTZ
  )
  RETURNING id INTO v_credit_id;

  RETURN v_credit_id;
END;
$grant_game_score_credits$;

CREATE OR REPLACE FUNCTION public.submit_game_score(
  p_customer_phone TEXT,
  p_customer_name TEXT,
  p_business_id TEXT,
  p_week_start DATE,
  p_score INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $submit_game_score$
DECLARE
  v_credit RECORD;
  v_submission_id UUID;
  v_display_name TEXT;
  v_remaining INTEGER;
BEGIN
  IF p_customer_phone IS NULL OR p_business_id IS NULL OR p_week_start IS NULL THEN
    RAISE EXCEPTION 'MISSING_GAME_SCORE_FIELDS' USING ERRCODE = '22023';
  END IF;

  IF p_score IS NULL OR p_score < 0 THEN
    RAISE EXCEPTION 'INVALID_GAME_SCORE' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_credit
  FROM game_score_credits
  WHERE customer_phone = p_customer_phone
    AND business_id = p_business_id
    AND week_start = p_week_start
    AND credits_used < credits_granted
    AND expires_at > NOW()
  ORDER BY created_at ASC, id ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_GAME_CREDITS' USING ERRCODE = 'P0001';
  END IF;

  UPDATE game_score_credits
  SET credits_used = credits_used + 1
  WHERE id = v_credit.id
  RETURNING credits_granted - credits_used INTO v_remaining;

  v_display_name := game_display_name(p_customer_name, p_customer_phone);

  INSERT INTO game_score_submissions (
    customer_phone,
    customer_name,
    display_name,
    business_id,
    week_start,
    score,
    credit_id
  )
  VALUES (
    p_customer_phone,
    p_customer_name,
    v_display_name,
    p_business_id,
    p_week_start,
    p_score,
    v_credit.id
  )
  RETURNING id INTO v_submission_id;

  INSERT INTO game_scores (
    customer_phone,
    customer_name,
    business_id,
    score,
    week_start,
    is_ranked,
    game_tokens_used
  )
  VALUES (
    p_customer_phone,
    p_customer_name,
    p_business_id,
    p_score,
    p_week_start,
    true,
    1
  );

  RETURN JSONB_BUILD_OBJECT(
    'ok', true,
    'submission_id', v_submission_id,
    'credits_remaining', v_remaining,
    'display_name', v_display_name
  );
END;
$submit_game_score$;

CREATE OR REPLACE FUNCTION public.close_game_weekly_winners(
  p_business_id TEXT,
  p_week_start DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $close_game_weekly_winners$
DECLARE
  v_inserted INTEGER;
BEGIN
  IF p_business_id IS NULL OR p_week_start IS NULL THEN
    RAISE EXCEPTION 'MISSING_GAME_WINNER_FIELDS' USING ERRCODE = '22023';
  END IF;

  DELETE FROM game_weekly_winners
  WHERE business_id = p_business_id
    AND week_start = p_week_start;

  WITH best_by_player AS (
    SELECT DISTINCT ON (customer_phone)
      customer_phone,
      display_name,
      score,
      id AS submission_id,
      created_at
    FROM game_score_submissions
    WHERE business_id = p_business_id
      AND week_start = p_week_start
    ORDER BY customer_phone, score DESC, created_at ASC
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) AS prize_rank,
      customer_phone,
      display_name,
      score,
      submission_id
    FROM best_by_player
    ORDER BY score DESC, created_at ASC
    LIMIT 3
  )
  INSERT INTO game_weekly_winners (
    business_id,
    week_start,
    rank,
    customer_phone,
    display_name,
    score,
    submission_id
  )
  SELECT
    p_business_id,
    p_week_start,
    prize_rank,
    customer_phone,
    display_name,
    score,
    submission_id
  FROM ranked;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$close_game_weekly_winners$;

REVOKE ALL ON FUNCTION public.game_display_name(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_game_score_credits(TEXT, TEXT, TEXT, UUID, DATE, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_game_score(TEXT, TEXT, TEXT, DATE, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.close_game_weekly_winners(TEXT, DATE) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.game_display_name(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_game_score_credits(TEXT, TEXT, TEXT, UUID, DATE, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_game_score(TEXT, TEXT, TEXT, DATE, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.close_game_weekly_winners(TEXT, DATE) TO service_role;

-- ─── RISHTEDAR AUTH MIGRATION ────────────────────────────────────────────────
-- Añade tabla staff_profiles para gestión de permisos de staff del dashboard.
-- Aplicar en: Supabase Dashboard → SQL Editor
-- Fecha: 2026-04-14
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── STAFF PROFILES ──────────────────────────────────────────────────────────
-- Un registro por usuario de staff. Vinculado a auth.users.
-- Las operaciones de admin (CRUD) usan service_role y bypasan RLS.

CREATE TABLE IF NOT EXISTS staff_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL
                CHECK (role IN ('super_admin', 'manager', 'kitchen'))
                DEFAULT 'manager',
  branches      TEXT[] NOT NULL DEFAULT '{}',
  -- Slugs de locales asignados: ['providencia'], ['la-reina', 'vitacura'], etc.
  -- Super admin usa ['*'] como comodín para todos los locales.
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- Cada usuario puede leer su propio perfil (usado por DashboardLayout / useStaffSession)
CREATE POLICY "staff_read_own_profile"
  ON staff_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Las operaciones de escritura (INSERT, UPDATE, DELETE) se hacen desde API routes
-- con service_role key, que bypasa RLS automáticamente. No se necesitan políticas
-- de escritura para el cliente anon/authenticated.

-- ─── TRIGGER: updated_at automático ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_staff_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_profiles_updated_at();

-- ─── ÍNDICE ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON staff_profiles(role);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_branches ON staff_profiles USING GIN(branches);

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { StaffProfile } from '@/types'

// ─── requireStaffSession ──────────────────────────────────────────────────────
// Valida que exista una sesión activa y que el perfil esté activo.
// Devuelve { session, profile } o un NextResponse de error listo para retornar.

type SessionSuccess = { ok: true; profile: StaffProfile; userId: string }
type SessionError   = { ok: false; response: NextResponse }
type SessionResult  = SessionSuccess | SessionError

export async function requireStaffSession(): Promise<SessionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
    }
  }

  // Leer perfil desde staff_profiles usando service_role para evitar
  // problemas de RLS en contextos de API route.
  const adminClient = await createAdminClient()
  const { data: profile, error: profileError } = await adminClient
    .from('staff_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Perfil de staff no encontrado' }, { status: 403 }),
    }
  }

  if (!profile.is_active) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 }),
    }
  }

  return { ok: true, profile: profile as StaffProfile, userId: user.id }
}

// ─── requireSuperAdmin ────────────────────────────────────────────────────────
// Shortcut: valida sesión + que el rol sea super_admin.

type AdminSuccess = { ok: true; profile: StaffProfile; userId: string }
type AdminError   = { ok: false; response: NextResponse }
type AdminResult  = AdminSuccess | AdminError

export async function requireSuperAdmin(): Promise<AdminResult> {
  const result = await requireStaffSession()
  if (!result.ok) return result

  if (result.profile.role !== 'super_admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Se requiere rol super_admin' }, { status: 403 }),
    }
  }

  return result
}

// ─── requireBranchAccess ──────────────────────────────────────────────────────
// Verifica que el perfil tenga acceso al business_id solicitado.
// super_admin con ['*'] tiene acceso a todo.

export function requireBranchAccess(profile: StaffProfile, businessId: string): boolean {
  if (profile.role === 'super_admin') return true
  if (profile.branches.includes('*')) return true
  return profile.branches.includes(businessId)
}

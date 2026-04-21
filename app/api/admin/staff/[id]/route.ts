import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/session'

// ─── PATCH /api/admin/staff/[id] — editar rol y branches ─────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await req.json()
  const { display_name, role, branches, is_active } = body

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const validRoles = ['super_admin', 'manager', 'kitchen']
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const updates: Record<string, unknown> = {}
  if (display_name !== undefined) updates.display_name = display_name
  if (role         !== undefined) updates.role         = role
  if (branches     !== undefined) updates.branches     = Array.isArray(branches) ? branches : [branches]
  if (is_active    !== undefined) updates.is_active    = is_active

  const { error } = await supabase
    .from('staff_profiles')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// ─── DELETE /api/admin/staff/[id] — soft delete (desactivar) ─────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params

  // No permitir que el super_admin se desactive a sí mismo
  if (auth.userId === id) {
    return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('staff_profiles')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

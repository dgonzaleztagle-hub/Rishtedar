import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/session'

const EMAIL_DOMAIN = 'rishtedar.local'

// ─── GET /api/admin/staff — listar todos los staff ────────────────────────────

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const supabase = await createAdminClient()

  // Obtener perfiles
  const { data: profiles, error: profilesError } = await supabase
    .from('staff_profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  // Obtener lista de usuarios de Auth para cruzar el email
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const usersById = Object.fromEntries(users.map(u => [u.id, u]))

  const result = (profiles ?? []).map(p => ({
    ...p,
    email:       usersById[p.id]?.email ?? null,
    last_sign_in: usersById[p.id]?.last_sign_in_at ?? null,
  }))

  return NextResponse.json(result)
}

// ─── POST /api/admin/staff — crear nuevo usuario ──────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const body = await req.json()
  const { username, display_name, role, branches, password } = body

  if (!username || !display_name || !role || !branches || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const validRoles = ['super_admin', 'manager', 'kitchen']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const email = `${username.toLowerCase().trim()}@${EMAIL_DOMAIN}`
  const supabase = await createAdminClient()

  // Crear usuario en Auth
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name },
  })

  if (createError) {
    const msg = createError.message.toLowerCase().includes('already')
      ? 'El usuario ya existe'
      : createError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId = userData.user.id

  // Crear perfil
  const { error: profileError } = await supabase
    .from('staff_profiles')
    .insert({
      id:           userId,
      display_name,
      role,
      branches:     Array.isArray(branches) ? branches : [branches],
      is_active:    true,
    })

  if (profileError) {
    // Rollback: eliminar usuario de Auth
    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ id: userId, email }, { status: 201 })
}

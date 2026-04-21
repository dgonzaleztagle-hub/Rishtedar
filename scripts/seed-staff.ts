/**
 * seed-staff.ts
 * Crea los usuarios de staff en Supabase Auth + staff_profiles.
 * Idempotente: si el usuario ya existe, solo actualiza el perfil.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/seed-staff.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Usuarios a crear ─────────────────────────────────────────────────────────

const STAFF = [
  {
    username:    'admin',
    displayName: 'Admin Global',
    role:        'super_admin' as const,
    branches:    ['*'],
  },
  {
    username:    'providencia',
    displayName: 'Providencia',
    role:        'manager' as const,
    branches:    ['providencia'],
  },
  {
    username:    'vitacura',
    displayName: 'Vitacura',
    role:        'manager' as const,
    branches:    ['vitacura'],
  },
  {
    username:    'la-reina',
    displayName: 'La Reina',
    role:        'manager' as const,
    branches:    ['la-reina'],
  },
  {
    username:    'la-dehesa',
    displayName: 'La Dehesa',
    role:        'manager' as const,
    branches:    ['la-dehesa'],
  },
]

const DEFAULT_PASSWORD = 'prueba'
const EMAIL_DOMAIN = 'rishtedar.local'

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('🚀  Seeding Rishtedar staff users...\n')

  for (const staff of STAFF) {
    const email = `${staff.username}@${EMAIL_DOMAIN}`

    // 1. Intentar crear usuario en Auth
    let userId: string | undefined

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: staff.displayName },
    })

    if (createError) {
      if (createError.message.toLowerCase().includes('already been registered') ||
          createError.message.toLowerCase().includes('already exists')) {
        // Usuario ya existe → buscar por email
        const { data: list } = await supabase.auth.admin.listUsers()
        const existing = list?.users?.find(u => u.email === email)
        userId = existing?.id
        console.log(`  ↺  ${staff.username} (ya existía, actualizando perfil)`)
      } else {
        console.error(`  ❌  ${staff.username}: ${createError.message}`)
        continue
      }
    } else {
      userId = created.user?.id
      console.log(`  ✓  ${staff.username} creado`)
    }

    if (!userId) {
      console.error(`  ❌  ${staff.username}: no se pudo obtener ID`)
      continue
    }

    // 2. Upsert en staff_profiles
    const { error: profileError } = await supabase
      .from('staff_profiles')
      .upsert({
        id:           userId,
        display_name: staff.displayName,
        role:         staff.role,
        branches:     staff.branches,
        is_active:    true,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error(`  ❌  ${staff.username} perfil: ${profileError.message}`)
    } else {
      console.log(`     └─ perfil OK (${staff.role}, branches: ${staff.branches.join(', ')})`)
    }
  }

  console.log('\n✅  Seed completado.')
  console.log(`\n   Credenciales de acceso (password: "${DEFAULT_PASSWORD}")`)
  STAFF.forEach(s => {
    console.log(`   ${s.username.padEnd(12)} → ${s.username}@${EMAIL_DOMAIN}`)
  })
}

run().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})

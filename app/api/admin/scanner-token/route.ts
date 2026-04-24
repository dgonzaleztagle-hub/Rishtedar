import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession, requireBranchAccess } from '@/lib/auth/session'
import { getBranchToken } from '@/lib/staff-tokens'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rishtedar.vercel.app'

// GET /api/admin/scanner-token?branch=X
// Retorna la URL del scanner con token para la sucursal indicada
export async function GET(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  const branch = new URL(req.url).searchParams.get('branch')
  if (!branch) return NextResponse.json({ error: 'Falta branch' }, { status: 400 })

  if (!requireBranchAccess(auth.profile, branch)) {
    return NextResponse.json({ error: 'Sin acceso a esta sucursal' }, { status: 403 })
  }

  const token = await getBranchToken(branch)
  if (!token) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })

  const url = `${APP_URL}/scanner/${branch}?t=${token}`
  return NextResponse.json({ url, branch, token })
}

// POST /api/admin/scanner-token
// Body: { branch }
// Rota el token de una sucursal — invalida URLs anteriores inmediatamente
export async function POST(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  if (auth.profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super_admin puede rotar tokens' }, { status: 403 })
  }

  const { branch } = await req.json() as { branch?: string }
  if (!branch) return NextResponse.json({ error: 'Falta branch' }, { status: 400 })

  const newToken = Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('hex')

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('branch_scanner_tokens')
    .upsert({ branch_id: branch, token: newToken, rotated_at: new Date().toISOString(), rotated_by: auth.userId })

  if (error) {
    console.error('[scanner-token/rotate]', error)
    return NextResponse.json({ error: 'Error al rotar token' }, { status: 500 })
  }

  const url = `${APP_URL}/scanner/${branch}?t=${newToken}`
  return NextResponse.json({ ok: true, url, branch, token: newToken })
}

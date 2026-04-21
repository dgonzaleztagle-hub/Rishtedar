import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'

// GET /api/banners — list all (dashboard CMS)
export async function GET() {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('promotional_banners')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[banners GET]', err)
    return NextResponse.json([], { status: 200 }) // silent fallback
  }
}

// POST /api/banners — create
export async function POST(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response
  try {
    const body = await req.json()
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('promotional_banners')
      .insert({ ...body, is_active: true })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[banners POST]', err)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}

// PATCH /api/banners — toggle active / update
export async function PATCH(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response
  try {
    const { id, ...updates } = await req.json()
    if (!id) throw new Error('id requerido')

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('promotional_banners')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[banners PATCH]', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

// DELETE /api/banners — delete
export async function DELETE(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('promotional_banners')
      .delete()
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[banners DELETE]', err)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}

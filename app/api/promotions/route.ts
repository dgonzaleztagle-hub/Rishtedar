import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/promotions — list all (dashboard CMS)
export async function GET() {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[promotions GET]', err)
    return NextResponse.json([], { status: 200 }) // silencioso — UI maneja fallback
  }
}

// POST /api/promotions — create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('promotions')
      .insert({ ...body, usage_count: 0, is_active: true })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[promotions POST]', err)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}

// PATCH /api/promotions — toggle active
export async function PATCH(req: NextRequest) {
  try {
    const { id, is_active } = await req.json()
    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('promotions')
      .update({ is_active })
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[promotions PATCH]', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

// DELETE /api/promotions — delete
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
    const supabase = await createAdminClient()
    const { error } = await supabase.from('promotions').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[promotions DELETE]', err)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}

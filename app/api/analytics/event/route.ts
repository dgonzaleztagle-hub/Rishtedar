import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const VALID_EVENTS = new Set([
  'page_view', 'view_menu', 'add_to_cart', 'remove_from_cart',
  'begin_checkout', 'purchase', 'reservation_started',
  'reservation_completed', 'lead_captured',
])

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { session_id, business_id, event_name, payload } = body

    if (!session_id || !event_name || !VALID_EVENTS.has(event_name)) {
      return NextResponse.json({ error: 'invalid event' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { error } = await supabase.from('analytics_events').insert({
      session_id,
      business_id: business_id ?? null,
      event_name,
      payload: payload ?? {},
    })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

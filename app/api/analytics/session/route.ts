import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      visitor_id, session_id, business_id, landing_page,
      referrer, device, utm_source, utm_medium, utm_campaign, utm_content,
    } = body

    if (!visitor_id || !session_id) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // INSERT OR IGNORE — si session_id ya existe no falla
    const { error } = await supabase
      .from('analytics_sessions')
      .upsert(
        {
          visitor_id, session_id, business_id: business_id ?? null,
          landing_page: landing_page ?? null, referrer: referrer ?? null,
          device: device ?? null, utm_source: utm_source ?? null,
          utm_medium: utm_medium ?? null, utm_campaign: utm_campaign ?? null,
          utm_content: utm_content ?? null,
        },
        { onConflict: 'session_id', ignoreDuplicates: true }
      )

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

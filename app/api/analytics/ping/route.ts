// Heartbeat — el browser llama esto cada 30 seg mientras el usuario está activo.
// Actualiza last_seen_at para que el dashboard sepa quién está "online ahora".

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json()
    if (!session_id) return NextResponse.json({ ok: false }, { status: 400 })

    const supabase = await createAdminClient()
    await supabase
      .from('analytics_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('session_id', session_id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

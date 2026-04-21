// Métricas en vivo: online ahora + visitas hoy.
// Online ahora = sesiones con last_seen_at > NOW() - 2 min
// Visitas hoy  = sesiones creadas desde medianoche

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const branch = searchParams.get('branch') ?? 'all'

  const supabase = await createAdminClient()

  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [onlineRes, todayRes] = await Promise.all([
    (() => {
      let q = supabase
        .from('analytics_sessions')
        .select('session_id', { count: 'exact', head: true })
        .gte('last_seen_at', twoMinAgo)
      if (branch !== 'all') q = q.eq('business_id', branch)
      return q
    })(),
    (() => {
      let q = supabase
        .from('analytics_sessions')
        .select('session_id', { count: 'exact', head: true })
        .gte('started_at', startOfDay.toISOString())
      if (branch !== 'all') q = q.eq('business_id', branch)
      return q
    })(),
  ])

  return NextResponse.json({
    online_now:   onlineRes.count  ?? 0,
    visits_today: todayRes.count   ?? 0,
  })
}

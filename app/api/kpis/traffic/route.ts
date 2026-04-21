// Fuentes de tráfico y sesiones por día.
// ?branch=all|slug&from=&to=

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const branch = searchParams.get('branch') ?? 'all'
  const from   = searchParams.get('from') ?? startOfMonth()
  const to     = searchParams.get('to')   ?? new Date().toISOString()

  const supabase = await createAdminClient()

  try {
    let q = supabase
      .from('analytics_sessions')
      .select('started_at, utm_source, utm_medium, device, converted')
      .gte('started_at', from)
      .lte('started_at', to)

    if (branch !== 'all') q = (q as any).eq('business_id', branch)

    const { data, error } = await q
    if (error) throw error

    const sessions = data ?? []

    // Sesiones por día
    const byDay: Record<string, number> = {}
    for (const s of sessions) {
      const day = s.started_at.slice(0, 10)
      byDay[day] = (byDay[day] ?? 0) + 1
    }
    const timeline = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, sessions: count }))

    // Fuentes de tráfico
    const sourceMap: Record<string, { sessions: number; converted: number }> = {}
    for (const s of sessions) {
      const source = normalizeSource(s.utm_source, s.utm_medium)
      if (!sourceMap[source]) sourceMap[source] = { sessions: 0, converted: 0 }
      sourceMap[source].sessions++
      if (s.converted) sourceMap[source].converted++
    }
    const sources = Object.entries(sourceMap)
      .map(([name, v]) => ({
        name,
        sessions: v.sessions,
        converted: v.converted,
        conversion_rate: v.sessions > 0 ? Math.round((v.converted / v.sessions) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)

    // Dispositivos
    const deviceMap: Record<string, number> = {}
    for (const s of sessions) {
      const d = s.device ?? 'unknown'
      deviceMap[d] = (deviceMap[d] ?? 0) + 1
    }
    const devices = Object.entries(deviceMap).map(([device, count]) => ({ device, count }))

    return NextResponse.json({
      period: { from, to },
      branch,
      total_sessions: sessions.length,
      timeline,
      sources,
      devices,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: 'Error calculando tráfico', detail }, { status: 500 })
  }
}

function normalizeSource(utm_source: string | null, utm_medium: string | null): string {
  if (!utm_source && !utm_medium) return 'direct'
  const src = (utm_source ?? '').toLowerCase()
  const med = (utm_medium ?? '').toLowerCase()
  if (src.includes('google') || med === 'cpc') return 'Google Ads'
  if (src.includes('instagram') || src.includes('ig')) return 'Instagram'
  if (src.includes('facebook') || src.includes('fb')) return 'Facebook'
  if (src.includes('tiktok')) return 'TikTok'
  if (med === 'organic' || src.includes('google')) return 'Google Orgánico'
  if (med === 'email') return 'Email'
  return utm_source ?? utm_medium ?? 'other'
}

function startOfMonth(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

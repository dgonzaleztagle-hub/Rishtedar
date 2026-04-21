'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LiveData {
  online_now: number
  visits_today: number
}

function Digit({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-9 bg-warm-950 border border-warm-800 font-mono text-lg font-bold text-emerald-400 tabular-nums">
      {value}
    </span>
  )
}

function Counter({ value, label }: { value: number; label: string }) {
  const digits = String(value).padStart(4, '0').split('')
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-0.5">
        {digits.map((d, i) => <Digit key={i} value={d} />)}
      </div>
      <p className="text-[10px] tracking-widest uppercase text-warm-400">{label}</p>
    </div>
  )
}

export function LiveCounter({ branch = 'all' }: { branch?: string }) {
  const [data, setData] = useState<LiveData>({ online_now: 0, visits_today: 0 })
  const [blink, setBlink] = useState(true)
  const supabase = createClient()
  const branchRef = useRef(branch)
  branchRef.current = branch

  async function fetchData() {
    const res = await fetch(`/api/kpis/realtime?branch=${branchRef.current}`)
    if (res.ok) setData(await res.json())
  }

  useEffect(() => {
    fetchData()

    // Refrescar cada 30 seg
    const interval = setInterval(fetchData, 30_000)

    // Suscripción Realtime — cuando llega una sesión nueva, actualizar
    const channel = supabase
      .channel('live-sessions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'analytics_sessions' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'analytics_sessions' },
        () => fetchData()
      )
      .subscribe()

    // Blink del LED cada segundo
    const blinker = setInterval(() => setBlink(v => !v), 1000)

    return () => {
      clearInterval(interval)
      clearInterval(blinker)
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch cuando cambia el branch
  useEffect(() => { fetchData() }, [branch])

  return (
    <div className="bg-warm-950 border border-warm-800 p-5 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
      {/* Header estilo terminal */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="w-2.5 h-2.5 rounded-full bg-emerald-400 transition-opacity duration-500"
          style={{ opacity: blink ? 1 : 0.2 }}
        />
        <span className="text-emerald-400 text-[10px] font-mono tracking-widest uppercase">Live</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
        <Counter value={data.online_now}   label="En línea ahora" />
        <div className="hidden sm:block w-px h-12 bg-warm-800" />
        <Counter value={data.visits_today} label="Visitas hoy" />
      </div>

      <p className="text-warm-700 text-[9px] font-mono ml-auto hidden lg:block">
        actualiza cada 30s
      </p>
    </div>
  )
}

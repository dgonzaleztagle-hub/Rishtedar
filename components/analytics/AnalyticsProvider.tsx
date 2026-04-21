'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initSession, trackEvent, pingSession } from '@/lib/analytics/tracker'

// Extrae business_id de la URL cuando aplica.
// /locales/providencia → 'providencia', /order?local=vitacura → 'vitacura', resto → undefined
function businessFromPath(pathname: string, search: string): string | undefined {
  const localesMatch = pathname.match(/^\/locales\/([^/]+)/)
  if (localesMatch) return localesMatch[1]

  const params = new URLSearchParams(search)
  const local = params.get('local')
  if (local) return local

  return undefined
}

export function AnalyticsProvider() {
  const pathname = usePathname()

  // Inicializar sesión + arrancar ping de heartbeat
  useEffect(() => {
    const search = window.location.search
    const businessId = businessFromPath(pathname, search)
    initSession(businessId)

    // Ping inmediato + cada 30 seg mientras la pestaña esté activa
    pingSession()
    const interval = setInterval(() => {
      if (!document.hidden) pingSession()
    }, 30_000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Page view en cada cambio de ruta
  useEffect(() => {
    const search = window.location.search
    const businessId = businessFromPath(pathname, search)
    trackEvent('page_view', { path: pathname }, businessId)
  }, [pathname])

  return null
}

'use client'

import { useState, useEffect } from 'react'
import { LOCATIONS, getLocationBySlug } from '@/lib/locations'
import { getDistanceFromLatLng } from '@/lib/utils'
import type { Business } from '@/types'

interface NearestLocationResult {
  location: Business | null
  distance: number | null
  loading: boolean
  error: string | null
}

export function useNearestLocation(): NearestLocationResult {
  const [result, setResult] = useState<NearestLocationResult>({
    location: null,
    distance: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!navigator.geolocation) {
      const timer = window.setTimeout(() => {
        setResult({
          location: getLocationBySlug('providencia') ?? LOCATIONS.find(l => l.is_active) ?? LOCATIONS[0],
          distance: null,
          loading: false,
          error: null,
        })
      }, 0)

      return () => window.clearTimeout(timer)
    }

    const fallbackLocation = LOCATIONS.find(l => l.is_active) ?? LOCATIONS[0]
    let cancelled = false

    const updateResult = (next: NearestLocationResult) => {
      if (!cancelled) setResult(next)
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords

        let nearest = LOCATIONS[0]
        let minDistance = Infinity

        for (const loc of LOCATIONS) {
          if (!loc.is_active) continue
          const d = getDistanceFromLatLng(latitude, longitude, loc.latitude, loc.longitude)
          if (d < minDistance) {
            minDistance = d
            nearest = loc
          }
        }

        updateResult({
          location: nearest,
          distance: minDistance,
          loading: false,
          error: null,
        })
      },
      () => {
        // Denied or unavailable — default to first active
        updateResult({
          location: fallbackLocation,
          distance: null,
          loading: false,
          error: null,
        })
      },
      { timeout: 8000, maximumAge: 300_000 }
    )

    return () => {
      cancelled = true
    }
  }, [])

  return result
}

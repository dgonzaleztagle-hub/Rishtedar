'use client'

import { useState, useEffect } from 'react'
import type { Promotion } from '@/types'

export function useActivePromotion(businessId?: string) {
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPromotion() {
      try {
        const params = businessId ? `?business_id=${businessId}` : ''
        const res = await fetch(`/api/promotions/active${params}`)
        const data: Promotion[] = await res.json()

        if (!Array.isArray(data) || data.length === 0) {
          setLoading(false)
          return
        }

        const now = new Date()
        const dayOfWeek = now.getDay()
        const hour = now.getHours()

        const match = data.find(promo => {
          if (promo.day_of_week !== null && promo.day_of_week !== dayOfWeek) return false
          if (promo.start_hour !== null && promo.end_hour !== null) {
            if (hour < promo.start_hour || hour >= promo.end_hour) return false
          }
          return true
        })

        setPromotion(match ?? null)
      } catch {
        // silencioso
      } finally {
        setLoading(false)
      }
    }

    fetchPromotion()
  }, [businessId])

  return { promotion, loading }
}

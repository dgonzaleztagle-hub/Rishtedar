'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Promotion } from '@/types'

export function useActivePromotion(businessId?: string) {
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPromotion() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
        setLoading(false)
        return
      }
      const supabase = createClient()
      const now = new Date()
      const dayOfWeek = now.getDay() // 0=Sun...6=Sat
      const hour = now.getHours()

      let query = supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('valid_from', now.toISOString())
        .gte('valid_to', now.toISOString())
        .order('discount_value', { ascending: false })
        .limit(1)

      if (businessId) {
        query = query.or(`local_id.is.null,local_id.eq.${businessId}`)
      }

      const { data } = await query

      if (data && data.length > 0) {
        const promo = data[0] as Promotion

        // Validate day of week if specified
        if (promo.day_of_week !== null && promo.day_of_week !== dayOfWeek) {
          setPromotion(null)
          setLoading(false)
          return
        }

        // Validate hour if specified
        if (promo.start_hour !== null && promo.end_hour !== null) {
          if (hour < promo.start_hour || hour >= promo.end_hour) {
            setPromotion(null)
            setLoading(false)
            return
          }
        }

        setPromotion(promo)
      }

      setLoading(false)
    }

    fetchPromotion()
  }, [businessId])

  return { promotion, loading }
}

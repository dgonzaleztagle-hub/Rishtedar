/**
 * loyaltyService — Single source of truth for loyalty points logic.
 *
 * Used by:
 *  - app/api/orders/create/route.ts   (award on order)
 *  - app/api/staff/award/route.ts     (manual award)
 *  - app/api/webhooks/mercadopago     (award on payment confirmed)
 *  - app/api/staff/customer/route.ts  (lookup)
 *
 * Portable: no Next.js deps, only Supabase admin client.
 */

import { createAdminClient } from '@/lib/supabase/server'
// Re-export pure constants so callers don't need two imports
export { TIER_THRESHOLDS, calculateTier, type Tier } from '@/lib/loyalty/config'
import { calculateTier } from '@/lib/loyalty/config'

/** 1 punto por cada $1.000 CLP del precio final */
export function calculatePointsForOrder(finalPrice: number): number {
  return Math.floor(finalPrice / 1000)
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AwardPointsParams {
  customerPhone: string
  customerName:  string
  businessId:    string
  /** null for manual/non-order awards */
  orderId:       string | null
  /** Human-readable reference for the transaction note */
  orderNumber:   string
  points:        number
  reason:        'order' | 'manual' | 'redemption'
}

export interface LoyaltyRecord {
  found:       boolean
  name:        string
  points:      number
  totalPoints: number
  tier:        'bronze' | 'silver' | 'gold'
  totalVisits: number
  lastVisit:   string | null
}

// ─── DB operations ────────────────────────────────────────────────────────────

/**
 * Award points to a customer. Creates the record if it doesn't exist.
 * Returns the new total and recalculated tier.
 */
export async function awardPoints({
  customerPhone, customerName, businessId,
  orderId, orderNumber, points, reason,
}: AwardPointsParams): Promise<{ newTotal: number; tier: 'bronze' | 'silver' | 'gold' }> {
  if (points <= 0) return { newTotal: 0, tier: 'bronze' }

  const supabase = await createAdminClient()

  const { data: existing } = await supabase
    .from('loyalty_points')
    .select('id, points_current, points_total_historical, total_visits')
    .eq('customer_phone', customerPhone)
    .eq('business_id', businessId)
    .maybeSingle()

  const newTotal = (existing?.points_current ?? 0) + points
  const newTier  = calculateTier(newTotal)
  const incrementVisit = reason === 'order' || reason === 'manual'

  if (existing) {
    await supabase
      .from('loyalty_points')
      .update({
        points_current:          newTotal,
        points_total_historical: existing.points_total_historical + points,
        total_visits:            incrementVisit ? existing.total_visits + 1 : existing.total_visits,
        last_visit_at:           new Date().toISOString(),
        tier:                    newTier,
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('loyalty_points').insert({
      customer_phone:          customerPhone,
      customer_name:           customerName,
      business_id:             businessId,
      points_current:          points,
      points_total_historical: points,
      total_visits:            1,
      last_visit_at:           new Date().toISOString(),
      tier:                    newTier,
    })
  }

  await supabase.from('loyalty_transactions').insert({
    customer_phone: customerPhone,
    business_id:    businessId,
    order_id:       orderId,
    points_delta:   points,
    reason,
    notes:          orderNumber,
  })

  return { newTotal, tier: newTier }
}

/**
 * Fetch a customer's loyalty record for a given branch.
 * Returns null if the customer has no record at that branch.
 */
export async function getCustomerLoyalty(
  phone: string,
  businessId: string,
): Promise<LoyaltyRecord | null> {
  const supabase = await createAdminClient()

  const { data } = await supabase
    .from('loyalty_points')
    .select('customer_name, points_current, points_total_historical, tier, total_visits, last_visit_at')
    .eq('customer_phone', phone)
    .eq('business_id', businessId)
    .maybeSingle()

  if (!data) return null

  return {
    found:       true,
    name:        data.customer_name,
    points:      data.points_current,
    totalPoints: data.points_total_historical,
    tier:        data.tier as 'bronze' | 'silver' | 'gold',
    totalVisits: data.total_visits,
    lastVisit:   data.last_visit_at,
  }
}

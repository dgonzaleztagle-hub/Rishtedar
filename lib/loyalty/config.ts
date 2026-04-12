/**
 * Loyalty tier configuration — pure constants, safe to import client-side.
 * Server-side logic (awardPoints, getCustomerLoyalty) lives in loyaltyService.ts.
 */

export const TIER_THRESHOLDS = {
  silver: 1000,
  gold:   5000,
} as const

export type Tier = 'bronze' | 'silver' | 'gold'

export function calculateTier(points: number): Tier {
  if (points >= TIER_THRESHOLDS.gold)   return 'gold'
  if (points >= TIER_THRESHOLDS.silver) return 'silver'
  return 'bronze'
}

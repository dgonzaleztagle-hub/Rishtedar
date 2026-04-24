/**
 * gameService - Shared game utilities.
 *
 * Pure functions (getWeekStart, getWeekLabel) are safe to import client-side.
 */

// ─── Pure helpers (client + server safe) ─────────────────────────────────────

/** Returns the ISO date string (YYYY-MM-DD) of the Monday of the current week. */
export function getWeekStart(): string {
  const d   = new Date()
  const day = d.getDay()
  // getDay: 0=Sun, 1=Mon ... so shift to make Monday=0
  const diff = (day === 0 ? -6 : 1) - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return monday.toISOString().slice(0, 10)
}

export function getWeekLabel(): string {
  return `Semana del ${getWeekStart()}`
}

export function getWeekExpiresAt(weekStart = getWeekStart()): string {
  const expiresAt = new Date(`${weekStart}T00:00:00.000Z`)
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 7)
  return expiresAt.toISOString()
}

export function formatGameDisplayName(name?: string | null, phone?: string | null): string {
  const cleanName = name?.trim().replace(/\s+/g, ' ')

  if (!cleanName) {
    const digits = phone?.replace(/\D/g, '') ?? ''
    return `Jugador ${digits.slice(-4) || 'Circle'}`
  }

  const [firstName, firstLastName] = cleanName.split(' ')
  const displayFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()

  if (!firstLastName) return displayFirstName

  return `${displayFirstName} ${firstLastName.charAt(0).toUpperCase()}.`
}

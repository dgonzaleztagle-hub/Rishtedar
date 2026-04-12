/**
 * gameService — Shared game utilities (pure + DB).
 *
 * Pure functions (getWeekStart, getWeekLabel) are safe to import client-side.
 * DB functions (getRankedAttemptsThisWeek, submitRankedScore, getLeaderboard)
 * are server-side only.
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

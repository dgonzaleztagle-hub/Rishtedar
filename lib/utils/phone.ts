/**
 * Chilean phone normalization utilities.
 *
 * Canonical format: +56XXXXXXXXX  ("+56" + 9 digits)
 *
 * Accepted input examples:
 *   912345678       → +56912345678
 *   9 1234 5678     → +56912345678
 *   +56912345678    → +56912345678
 *   56912345678     → +56912345678
 *   +56 9 1234 5678 → +56912345678
 *
 * Valid first digit after country code:
 *   9  → mobile (national)
 *   2  → Santiago landline
 *   (others rejected for now)
 */

export function normalizeChileanPhone(input: string): string | null {
  if (!input) return null

  // Strip whitespace, dashes, dots, parens
  let s = input.replace(/[\s\-\.\(\)]/g, '')

  // Drop leading +
  if (s.startsWith('+')) s = s.slice(1)

  // If has country code 56 and total is 11 digits → strip the prefix
  if (s.startsWith('56') && s.length === 11) s = s.slice(2)

  // Must now be exactly 9 digits
  if (!/^\d{9}$/.test(s)) return null

  // Only mobile (9) and Santiago landline (2) accepted
  if (!s.startsWith('9') && !s.startsWith('2')) return null

  return `+56${s}`
}

/** Returns true if the input can be normalized to a valid Chilean number. */
export function isValidChileanPhone(input: string): boolean {
  return normalizeChileanPhone(input) !== null
}

/**
 * Pretty-prints a normalized phone number.
 * +56912345678 → +56 9 1234 5678
 */
export function formatPhoneDisplay(normalized: string): string {
  const d = normalized.slice(3) // strip "+56"
  if (d.length === 9 && d.startsWith('9')) {
    return `+56 ${d[0]} ${d.slice(1, 5)} ${d.slice(5)}`
  }
  return normalized
}

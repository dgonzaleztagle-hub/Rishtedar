// Tokens por sucursal para el escáner liviano (/scanner/[branch])
// El encargado comparte la URL una vez; los mozos la guardan en su teléfono.
// Para rotar un token: cambiar aquí + deploy. Sin DB, sin complicaciones.

export const BRANCH_TOKENS: Record<string, string> = {
  providencia: process.env.SCANNER_TOKEN_PROVIDENCIA ?? 'RSH-PROV-2024',
  vitacura:    process.env.SCANNER_TOKEN_VITACURA    ?? 'RSH-VITA-2024',
  'la-reina':  process.env.SCANNER_TOKEN_LA_REINA   ?? 'RSH-REINA-2024',
  'la-dehesa': process.env.SCANNER_TOKEN_LA_DEHESA  ?? 'RSH-DEHESA-2024',
  admin:       process.env.SCANNER_TOKEN_ADMIN       ?? 'RSH-ADMIN-2024',
}

export function validateBranchToken(branch: string, token: string): boolean {
  const expected = BRANCH_TOKENS[branch]
  if (!expected) return false
  return token === expected
}

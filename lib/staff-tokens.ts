// Tokens por sucursal para el escáner liviano (/scanner/[branch])
// El encargado comparte la URL una vez; los mozos la guardan en su teléfono.
// Para rotar un token: cambiar aquí + deploy. Sin DB, sin complicaciones.

export const BRANCH_TOKENS: Record<string, string | undefined> = {
  providencia: process.env.SCANNER_TOKEN_PROVIDENCIA,
  vitacura:    process.env.SCANNER_TOKEN_VITACURA,
  'la-reina':  process.env.SCANNER_TOKEN_LA_REINA,
  'la-dehesa': process.env.SCANNER_TOKEN_LA_DEHESA,
  admin:       process.env.SCANNER_TOKEN_ADMIN,
}

export function validateBranchToken(branch: string, token: string): boolean {
  const expected = BRANCH_TOKENS[branch]
  if (!expected) return false
  return token === expected
}

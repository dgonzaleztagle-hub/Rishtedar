import { createAdminClient } from '@/lib/supabase/server'

// Valida token de sucursal leyendo desde BD (permite rotación sin redeploy)
// Fallback a env vars si la BD no tiene registro aún
export async function validateBranchToken(branch: string, token: string): Promise<boolean> {
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('branch_scanner_tokens')
      .select('token')
      .eq('branch_id', branch)
      .single()

    if (data) return data.token === token
  } catch {
    // BD no disponible → caer a env vars
  }

  // Fallback a env vars (durante migración o si la tabla no existe aún)
  const envMap: Record<string, string | undefined> = {
    providencia: process.env.SCANNER_TOKEN_PROVIDENCIA,
    vitacura:    process.env.SCANNER_TOKEN_VITACURA,
    'la-reina':  process.env.SCANNER_TOKEN_LA_REINA,
    'la-dehesa': process.env.SCANNER_TOKEN_LA_DEHESA,
    admin:       process.env.SCANNER_TOKEN_ADMIN,
  }
  const expected = envMap[branch]
  return !!expected && token === expected
}

// Retorna el token activo para una sucursal (para generar URLs)
export async function getBranchToken(branch: string): Promise<string | null> {
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('branch_scanner_tokens')
      .select('token')
      .eq('branch_id', branch)
      .single()

    if (data) return data.token
  } catch {
    // ignorar
  }

  const envMap: Record<string, string | undefined> = {
    providencia: process.env.SCANNER_TOKEN_PROVIDENCIA,
    vitacura:    process.env.SCANNER_TOKEN_VITACURA,
    'la-reina':  process.env.SCANNER_TOKEN_LA_REINA,
    'la-dehesa': process.env.SCANNER_TOKEN_LA_DEHESA,
    admin:       process.env.SCANNER_TOKEN_ADMIN,
  }
  return envMap[branch] ?? null
}

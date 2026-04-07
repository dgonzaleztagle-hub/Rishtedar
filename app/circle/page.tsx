// Server Component — obtiene SSO token de vuelve.vip server-side
// Cuando VUELVE_TENANT_ID está seteado, el iframe carga el programa real
// Sin tenant → modo preview (para demo)

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CircleContent } from '@/components/circle/CircleContent'

export const metadata: Metadata = {
  title: 'Rishtedar Circle — Club de Fidelidad',
  description:
    'Únete a Rishtedar Circle. Acumula puntos en cada visita, desbloquea beneficios exclusivos y recibe sorpresas en tu cumpleaños.',
  alternates: { canonical: '/circle' },
}

async function getVuelveData(): Promise<{ iframeUrl: string | null; tenantSlug: string | null }> {
  // El slug ya lo conocemos — sirve para la URL pública del QR
  const knownSlug = process.env.NEXT_PUBLIC_VUELVE_SLUG ?? null

  const tenantId = process.env.VUELVE_TENANT_ID
  const secret   = process.env.VUELVE_SSO_SECRET

  // Si no tenemos UUID todavía, devolvemos el slug igual (para el QR público)
  const isUuidMissing = !tenantId || tenantId.includes('your_vuelve_tenant')
  if (isUuidMissing) {
    return { iframeUrl: null, tenantSlug: knownSlug }
  }

  try {
    const res = await fetch('https://vuelve.vip/api/sso/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, secret }),
      cache: 'no-store',
    })
    if (!res.ok) return { iframeUrl: null, tenantSlug: knownSlug }

    const data = await res.json()
    const slug = data.tenant_slug ?? knownSlug
    const iframeUrl = `https://vuelve.vip/cliente?sso_token=${data.sso_token}&iframe=true&slug=${slug}`
    return { iframeUrl, tenantSlug: slug }
  } catch {
    return { iframeUrl: null, tenantSlug: knownSlug }
  }
}

export default async function CirclePage() {
  const { iframeUrl, tenantSlug } = await getVuelveData()

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen">
        <CircleContent
          iframeUrl={iframeUrl}
          tenantSlug={tenantSlug}
        />
      </main>
      <Footer />
    </>
  )
}

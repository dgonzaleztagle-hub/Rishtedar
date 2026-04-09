import type { Metadata, Viewport } from 'next'
import { SwRegistrar } from '@/components/pwa/SwRegistrar'

export const viewport: Viewport = {
  themeColor: '#0d0d0d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Rishtedar App',
  description: 'Sigue tu pedido, acumula puntos y juega.',
  manifest: '/manifest.json',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rishtedar',
  },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SwRegistrar />
      <div className="min-h-screen bg-warm-950 text-ivory">
        {children}
      </div>
    </>
  )
}

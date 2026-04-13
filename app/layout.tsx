import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#91226f',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://rishtedar.cl'),
  title: {
    default: 'Rishtedar — Cocina India Premium · Santiago & Miami',
    template: '%s · Rishtedar',
  },
  description:
    'Experiencia gastronómica india auténtica en Santiago y Miami. Reservas, delivery y menú en línea. Abrimos en Providencia, Vitacura, La Reina y La Dehesa.',
  keywords: [
    'restaurante indio santiago',
    'comida india santiago',
    'rishtedar',
    'curry santiago',
    'delivery comida india',
    'reservas restaurante',
    'providencia',
    'vitacura',
    'miami indian restaurant',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://rishtedar.cl',
    siteName: 'Rishtedar',
    title: 'Rishtedar — Cocina India Premium',
    description: 'Experiencia gastronómica india auténtica en Santiago y Miami.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Rishtedar — Cocina India Premium',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rishtedar — Cocina India Premium',
    description: 'Experiencia gastronómica india auténtica en Santiago y Miami.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192' }],
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-ivory text-warm-950">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#120008',
              color: '#faf7f0',
              border: '1px solid rgba(201,149,42,0.3)',
              fontFamily: 'var(--font-inter)',
            },
          }}
        />
      </body>
    </html>
  )
}

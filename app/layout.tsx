import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Toaster } from 'sonner'
import { PromotionalBannerPopup } from '@/components/PromotionalBannerPopup'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'

const GA4_ID  = process.env.NEXT_PUBLIC_GA4_ID   // G-XXXXXXXXXX — pendiente cliente
const META_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID // XXXXXXXXXXXXXXXX — pendiente cliente

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
      <head>
        {/* GA4 — activar cuando cliente entregue Measurement ID */}
        {GA4_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}', { send_page_view: false });
            `}</Script>
          </>
        )}
        {/* Meta Pixel — activar cuando cliente entregue Pixel ID */}
        {META_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_ID}');
          `}</Script>
        )}
        {/* Banner typography — loaded via <link> to avoid PostCSS @import ordering issues */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Yatra+One&family=Baloo+2:wght@400;600;700&family=Rozha+One&family=Tillana:wght@400;600;700&family=Hind:wght@400;600;700&family=Mukta:wght@400;600;700&family=Playfair+Display:wght@600;700&family=Montserrat:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-ivory text-warm-950">
        <AnalyticsProvider />
        {children}
        <PromotionalBannerPopup />
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

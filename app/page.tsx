import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PromoBanner } from '@/components/home/PromoBanner'
import { ScrollVideoHero } from '@/components/home/ScrollVideoHero'
import { LocationsSection } from '@/components/home/LocationsSection'
import { MenuPreviewSection } from '@/components/home/MenuPreviewSection'
import { ExperiencesSection } from '@/components/home/ExperiencesSection'
import { FidelizacionSection } from '@/components/home/FidelizacionSection'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rishtedar — Cocina India Premium · Santiago & Miami',
  alternates: {
    canonical: '/',
  },
}

export default function HomePage() {
  return (
    <>
      <SchemaOrg />
      <PromoBanner />
      <Header />
      <main>
        <ScrollVideoHero />
        <LocationsSection />
        <MenuPreviewSection />
        <ExperiencesSection />
        <FidelizacionSection />
      </main>
      <Footer />
    </>
  )
}

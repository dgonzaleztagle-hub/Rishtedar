import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SearchFlow } from '@/components/search/SearchFlow'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buscar',
  description: 'Busca en el menú de Rishtedar, locales y más.',
  alternates: { canonical: '/search' },
}

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-ivory">
        <Suspense>
          <SearchFlow />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { EXPERIENCES, getExperience } from '@/lib/data/experiences'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const exp = getExperience(slug)
  if (!exp) return {}
  return {
    title: `${exp.title} · Rishtedar`,
    description: exp.description,
    alternates: { canonical: `/experiencias/${slug}` },
    openGraph: {
      images: [{ url: exp.heroPhoto }],
    },
  }
}

export function generateStaticParams() {
  return EXPERIENCES.map(e => ({ slug: e.slug }))
}

export default async function ExperienciaPage({ params }: Props) {
  const { slug } = await params
  const exp = getExperience(slug)
  if (!exp) notFound()

  // Find prev / next for navigation
  const idx = EXPERIENCES.findIndex(e => e.slug === slug)
  const prev = EXPERIENCES[idx - 1] ?? null
  const next = EXPERIENCES[idx + 1] ?? null

  return (
    <>
      <Header />
      <main className="bg-warm-950">

        {/* ── Hero full-bleed ── */}
        <div className="relative h-[70vh] md:h-[85vh] min-h-[480px]">
          <Image
            src={exp.heroPhoto}
            alt={exp.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-warm-950/50 via-transparent to-warm-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-warm-950/60 to-transparent" />

          {/* Back link */}
          <div className="absolute top-24 left-6 md:left-10">
            <Link
              href="/experiencias"
              className="inline-flex items-center gap-2 text-warm-400 hover:text-gold-400 transition-colors text-xs tracking-widest uppercase"
            >
              <ArrowLeft size={13} />
              Experiencias
            </Link>
          </div>

          {/* Hero text */}
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-6 pb-12 md:pb-16">
            <p className="text-gold-500 text-[10px] tracking-[0.3em] uppercase mb-3">
              {exp.tag}
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl italic text-ivory leading-none mb-3">
              {exp.title}
            </h1>
            <p className="text-warm-300 text-base md:text-lg font-light max-w-lg">
              {exp.subtitle}
            </p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">

            {/* Main text */}
            <div className="lg:col-span-7">
              {exp.longDescription.map((para, i) => (
                <p
                  key={i}
                  className={`text-warm-300 leading-relaxed mb-6 ${i === 0 ? 'text-lg md:text-xl font-light' : 'text-sm md:text-base'}`}
                >
                  {para}
                </p>
              ))}

              {exp.cta && (
                <Link
                  href={exp.cta.href}
                  className="mt-4 inline-flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-warm-950 px-8 py-4 text-xs tracking-widest uppercase font-medium transition-colors group"
                >
                  {exp.cta.label}
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {/* Sidebar — gallery */}
            <div className="lg:col-span-5 space-y-3">
              {exp.galleryPhotos.map((photo, i) => (
                <div key={i} className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={photo}
                    alt={`${exp.title} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Prev / Next navigation ── */}
        <div className="border-t border-warm-800">
          <div className="grid grid-cols-2">
            {prev ? (
              <Link
                href={`/experiencias/${prev.slug}`}
                className="group flex flex-col gap-1 px-6 md:px-10 py-8 border-r border-warm-800 hover:bg-warm-900/40 transition-colors"
              >
                <span className="text-warm-600 text-[10px] tracking-widest uppercase flex items-center gap-1">
                  <ArrowLeft size={10} /> Anterior
                </span>
                <span className="font-display text-xl md:text-2xl italic text-warm-300 group-hover:text-ivory transition-colors">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/experiencias/${next.slug}`}
                className="group flex flex-col gap-1 items-end text-right px-6 md:px-10 py-8 hover:bg-warm-900/40 transition-colors"
              >
                <span className="text-warm-600 text-[10px] tracking-widest uppercase flex items-center gap-1">
                  Siguiente <ArrowRight size={10} />
                </span>
                <span className="font-display text-xl md:text-2xl italic text-warm-300 group-hover:text-ivory transition-colors">
                  {next.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* ── Ver todas ── */}
        <div className="container mx-auto px-6 py-12 text-center border-t border-warm-800">
          <Link
            href="/experiencias"
            className="inline-flex items-center gap-2 text-warm-500 hover:text-gold-400 transition-colors text-xs tracking-widest uppercase"
          >
            Ver todas las experiencias
            <ArrowRight size={11} />
          </Link>
        </div>

      </main>
      <Footer />
    </>
  )
}

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

const EXPERIENCES = [
  {
    id: 'aguamanil',
    title: 'Ritual Aguamanil',
    subtitle: 'Tradición milenaria',
    description: 'Una ceremonia de bienvenida única: el ritual del lavado de manos con agua de rosas y especias.',
    photo: '/images/brand/aguamanil.png',
    href: '/experiencias#aguamanil',
  },
  {
    id: 'masala',
    title: 'Masala Class',
    subtitle: 'Taller de especias',
    description: 'Aprende los secretos de las especias de la India junto a nuestros chefs.',
    photo: '/images/brand/masala.png',
    href: '/experiencias#masala',
  },
  {
    id: 'holi',
    title: 'Holi Fest',
    subtitle: 'Festival de colores',
    description: 'Celebra el festival de colores más vibrante de la India.',
    photo: '/images/brand/holi.png',
    href: '/experiencias#holi',
  },
  {
    id: 'baile',
    title: 'Noches de Baile',
    subtitle: 'Danza clásica india',
    description: 'Música en vivo y danza bharatanatyam en una noche de cultura pura.',
    photo: '/images/brand/baile.png',
    href: '/experiencias#baile',
  },
  {
    id: 'bindi',
    title: 'Arte Bindi & Henna',
    subtitle: 'Mehndi Nights',
    description: 'Artistas invitados que realizan el arte del tatuaje de henna en vivo.',
    photo: '/images/brand/bindi.png',
    href: '/experiencias#bindi',
  },
]

function ExperienceCard({ exp, tall = false }: { exp: typeof EXPERIENCES[0]; tall?: boolean }) {
  return (
    <Link
      href={exp.href}
      className={`group relative block overflow-hidden ${tall ? 'h-[540px] md:h-full min-h-[480px]' : 'h-[260px]'}`}
    >
      <Image
        src={exp.photo}
        alt={exp.title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 40vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-warm-950/90 via-warm-950/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <p className="text-gold-500 text-[10px] tracking-[0.25em] uppercase mb-1">{exp.subtitle}</p>
        <h3 className={`font-display italic text-ivory leading-tight mb-2 ${tall ? 'text-3xl' : 'text-xl'}`}>
          {exp.title}
        </h3>
        {tall && (
          <p className="text-warm-300 text-sm leading-relaxed mb-3 max-w-xs">{exp.description}</p>
        )}
        <div className="flex items-center gap-2 text-gold-400 text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          Descubrir <ArrowRight size={11} />
        </div>
      </div>
    </Link>
  )
}

export function ExperiencesSection() {
  const [featured, ...rest] = EXPERIENCES

  return (
    <section className="bg-warm-950 py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-3">
              Más que un restaurante
            </p>
            <h2 className="font-display text-5xl md:text-7xl italic text-ivory leading-none">
              Vive la India
            </h2>
          </div>
          <p className="text-warm-400 text-sm leading-relaxed max-w-xs">
            Cada visita es una puerta a la cultura india. Experiencias que van más allá del plato.
          </p>
        </motion.div>

        {/* Editorial grid: 1 tall featured + 4 medium */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="md:col-span-5 md:row-span-2"
          >
            <ExperienceCard exp={featured} tall />
          </motion.div>

          {rest.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="md:col-span-3"
            >
              <ExperienceCard exp={exp} />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}

export interface Experience {
  slug: string
  tag: string
  title: string
  subtitle: string
  description: string
  longDescription: string[]
  heroPhoto: string
  galleryPhotos: string[]
  cta: { label: string; href: string } | null
  color: string // accent color class
}

export const EXPERIENCES: Experience[] = [
  {
    slug: 'aguamanil',
    tag: 'Tradición milenaria',
    title: 'Ritual Aguamanil',
    subtitle: 'La bienvenida que solo encontrarás aquí',
    description: 'Una ceremonia de bienvenida única: el ritual del lavado de manos con agua de rosas y especias.',
    longDescription: [
      'Al llegar a tu mesa, nuestro equipo te ofrece el aguamanil —una jofaina de cobre pulido— con agua tibia perfumada en pétalos de rosa, cardamomo y canela. Un gesto que en la India acompaña cada gran comida desde hace siglos.',
      'El ritual del aguamanil es un símbolo de hospitalidad pura. En sánscrito, el acto de lavar las manos antes de comer no es solo higiene: es una transición consciente entre el mundo exterior y la mesa. Es el momento en que el comensal se prepara para recibir.',
      'En Rishtedar lo practicamos porque creemos que una gran experiencia gastronómica comienza mucho antes del primer plato. Comienza en el instante en que te sientes bienvenido.',
    ],
    heroPhoto: '/images/brand/aguamanil.png',
    galleryPhotos: ['/images/brand/Rectangle-385.png', '/images/brand/Rectangle-388.png'],
    cta: { label: 'Reservar tu mesa', href: '/reservar' },
    color: 'gold',
  },
  {
    slug: 'masala',
    tag: 'Taller de especias',
    title: 'Masala Class',
    subtitle: 'Descubre los secretos detrás de cada plato',
    description: 'Aprende los secretos de las especias de la India junto a nuestros chefs.',
    longDescription: [
      'El garam masala no es una sola especia: es una composición. Cardamomo, canela, clavo, pimienta negra, comino, cilantro. Cada chef indio tiene su propia fórmula, su propio orden de tueste, su propio equilibrio entre calor y aroma.',
      'En las Masala Class aprenderás a leer el color del aceite para saber cuándo añadir las semillas, por qué el curry en polvo industrializado no existe en India, y cómo construir capas de sabor que hagan que un plato simple sea inolvidable.',
      'Las sesiones duran 90 minutos e incluyen degustación de los platos preparados y un blend personal de especias para llevar a casa. Grupos de hasta 12 personas. Disponible sábados bajo reserva anticipada.',
    ],
    heroPhoto: '/images/brand/masala.png',
    galleryPhotos: ['/images/brand/Rectangle-389.png', '/images/brand/Rectangle-396.png'],
    cta: { label: 'Reservar taller', href: '/reservar' },
    color: 'brand',
  },
  {
    slug: 'holi',
    tag: 'Festival de colores',
    title: 'Holi Fest',
    subtitle: 'El festival más vibrante de la India, en Santiago',
    description: 'Celebra el festival de colores más vibrante de la India.',
    longDescription: [
      'Holi marca el fin del invierno indio y el comienzo de la primavera. Según la mitología hindú, también celebra el triunfo del bien sobre el mal, la luz sobre la oscuridad. La tradición manda lanzar polvos de colores brillantes a amigos, familia y extraños por igual.',
      'Cada año en marzo, Rishtedar transforma sus salones en una explosión de color. Polvos naturales hechos a base de flores, un menú especial de temporada inspirado en los dulces tradicionales de Holi —gujiya, thandai, malpua— y música en vivo que lleva el ritmo del festival.',
      'Es una noche que no se parece a ninguna otra en Santiago. Ven con ropa que puedas manchar. Hay una razón por la que la lista de espera empieza semanas antes.',
    ],
    heroPhoto: '/images/brand/holi.png',
    galleryPhotos: ['/images/brand/Rectangle-402.png', '/images/brand/Rectangle-403.png'],
    cta: { label: 'Avisarme del próximo Holi', href: '/reservar' },
    color: 'gold',
  },
  {
    slug: 'baile',
    tag: 'Danza clásica india',
    title: 'Noches de Baile',
    subtitle: 'Música en vivo y danza bharatanatyam',
    description: 'Música en vivo y danza bharatanatyam en una noche de cultura pura.',
    longDescription: [
      'El bharatanatyam es una de las formas de danza clásica más antiguas del mundo. Nacida en los templos del sur de la India hace más de 2.000 años, cada movimiento de manos (mudra), cada expresión facial (abhinaya) y cada patrón de pies cuenta una historia de la mitología hindú.',
      'Las Noches de Baile de Rishtedar traen a artistas invitados de la comunidad india en Santiago. La velada incluye una presentación de 45 minutos con explicación en español de las historias narradas, seguida de música en vivo con tabla y sitar.',
      'Las mesas frente al escenario tienen una vista privilegiada y se agotan rápido. Se realizan el último viernes de cada mes.',
    ],
    heroPhoto: '/images/brand/baile.png',
    galleryPhotos: ['/images/brand/Rectangle-417-1-1.png', '/images/brand/Rectangle-422.png'],
    cta: { label: 'Reservar para la próxima noche', href: '/reservar' },
    color: 'brand',
  },
  {
    slug: 'bindi',
    tag: 'Mehndi Nights',
    title: 'Arte Bindi & Henna',
    subtitle: 'Cinco mil años de arte en tus manos',
    description: 'Artistas invitados que realizan el arte del tatuaje de henna en vivo.',
    longDescription: [
      'La henna (mehndi) se ha usado en el subcontinente indio desde hace más de 5.000 años. En las bodas, los patrones cubren manos y pies de la novia con diseños que pueden tardar hasta ocho horas en completarse. Cada motivo tiene un significado: flores para la alegría, pavos reales para la belleza, mangos para la fertilidad.',
      'En las Mehndi Nights de Rishtedar, artistas especializados realizan diseños en vivo sobre manos y antebrazos. También aplicamos bindis decorativos —esas marcas de frente que más allá de su significado espiritual son hoy una forma de arte en sí misma.',
      'Disponible en cenas especiales y a solicitud para eventos privados. El mehndi dura entre 1 y 3 semanas dependiendo del cuidado.',
    ],
    heroPhoto: '/images/brand/bindi.png',
    galleryPhotos: ['/images/brand/Rectangle-5.png', '/images/brand/Rectangle-14.png'],
    cta: { label: 'Consultar disponibilidad', href: '/reservar' },
    color: 'gold',
  },
]

export function getExperience(slug: string): Experience | undefined {
  return EXPERIENCES.find(e => e.slug === slug)
}

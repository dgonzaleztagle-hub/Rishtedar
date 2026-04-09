import type { MenuCategory, MenuItem } from '@/types'

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────
// Fuente: Carta real Rishtedar Providencia + Vitacura 2026
// Precios: Carta Providencia (vigente). Algunos platos exclusivos de Vitacura marcados.

export const DEMO_CATEGORIES: MenuCategory[] = [
  { id: 'cat-entradas',   business_id: 'providencia', name: 'Entradas',              order: 1 },
  { id: 'cat-veg',        business_id: 'providencia', name: 'Vegetariano',            order: 2 },
  { id: 'cat-pollo',      business_id: 'providencia', name: 'Pollo',                  order: 3 },
  { id: 'cat-mar',        business_id: 'providencia', name: 'Pescados y Mariscos',    order: 4 },
  { id: 'cat-cordero',    business_id: 'providencia', name: 'Cordero',                order: 5 },
  { id: 'cat-tandoor',    business_id: 'providencia', name: 'Del Tandoor',            order: 6 },
  { id: 'cat-305',        business_id: 'providencia', name: 'Rishtedar 305',          order: 7 },
  { id: 'cat-naan',       business_id: 'providencia', name: 'Pan Naan',               order: 8 },
  { id: 'cat-arroz',      business_id: 'providencia', name: 'Arroces & Biryanis',     order: 9 },
  { id: 'cat-postres',    business_id: 'providencia', name: 'Postres',                order: 10 },
  { id: 'cat-kids',       business_id: 'providencia', name: 'Menú Kids',              order: 11 },
  { id: 'cat-bebidas',    business_id: 'providencia', name: 'Bebidas',                order: 12 },
]

// ─── ITEMS ────────────────────────────────────────────────────────────────────

export const DEMO_MENU_ITEMS: MenuItem[] = [

  // ── ENTRADAS ────────────────────────────────────────────────────────────────

  {
    id: 'item-e01', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Empanadas de Butter Chicken',
    description: 'Dos empanadas rellenas de suave butter chicken y queso fundido. Una fusión indo-chilena llena de sabor.',
    price: 12400, image_url: null, is_active: true,
    dietary_tags: [], allergens: ['gluten', 'dairy'],
  },
  {
    id: 'item-e02', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Goa Chilly Bengan',
    description: 'Berenjenas en salsa de cebolla, pimiento, tomate y especias.',
    price: 6900, image_url: '/images/menu/goa-chilly-bengan.jpg', is_active: true,
    dietary_tags: ['vegan'], allergens: [],
  },
  {
    id: 'item-e03', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Goa Chilly Jheenga',
    description: 'Frescos camarones ecuatorianos en salsa de cebolla, pimiento, tomate y especias.',
    price: 10800, image_url: '/images/menu/goa-chilly-jheenga.jpg', is_active: true,
    dietary_tags: [], allergens: ['shellfish'],
  },
  {
    id: 'item-e04', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Jheenga Koliwada',
    description: 'Camarones apanados y marinados en masala con un toque picante y ácido.',
    price: 13000, image_url: '/images/menu/jheenga-koliwada.jpg', is_active: true,
    dietary_tags: ['spicy'], allergens: ['shellfish', 'gluten'],
  },
  {
    id: 'item-e05', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Jheenga Til Tikka',
    description: 'Camarones ecuatorianos apanados en sésamo y deliciosa salsa tikka con doce especias.',
    price: 13000, image_url: '/images/menu/jheenga-til-tikka.jpg', is_active: true,
    dietary_tags: [], allergens: ['shellfish'],
  },
  {
    id: 'item-e06', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Johar E Motia',
    description: 'Champiñones frescos en una salsa blanca suave con castañas de cajú y un toque sutil de cardamomo.',
    price: 14000, image_url: '/images/menu/johar-e-motia.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['nuts', 'dairy'],
  },
  {
    id: 'item-e07', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Machi Koliwada',
    description: 'Filetitos de merluza apanados y marinados en masala con un toque picante y ácido.',
    price: 14800, image_url: null, is_active: true,
    dietary_tags: ['spicy'], allergens: ['gluten'],
  },
  {
    id: 'item-e08', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Murgh Tikka',
    description: 'Especiado pollo al tandoor con salsa tikka.',
    price: 9700, image_url: '/images/menu/murgh-tikka.jpg', is_active: true,
    dietary_tags: ['spicy'], allergens: ['dairy'],
  },
  {
    id: 'item-e09', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Octopus Tikka Masala',
    description: 'Pulpo en salsa Tikka Masala, con cebolla y pimientos al dente acompañados de especias.',
    price: 23400, image_url: null, is_active: true,
    dietary_tags: [], allergens: ['dairy'],
  },
  {
    id: 'item-e10', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Pacora Mix',
    description: 'Crocantes frituras de queso indio, ají y cebolla en batido de garbanzo.',
    price: 9700, image_url: '/images/menu/pacora-mix.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['gluten', 'dairy'],
  },
  {
    id: 'item-e11', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Paneer Tikka',
    description: 'Queso de la casa macerado en una exótica salsa tikka a base de especias indias.',
    price: 9800, image_url: '/images/menu/paneer-tikka.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['dairy'],
  },
  {
    id: 'item-e12', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Samosas',
    description: 'Empanadillas de fina masa con comino, rellenas de papas y verduras con especias indias.',
    price: 8400, image_url: '/images/menu/samosas.jpg', is_active: true,
    dietary_tags: ['vegan'], allergens: ['gluten'],
  },
  {
    id: 'item-e13', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Sheekh Kabbab de Cordero',
    description: 'Trozos de cordero sazonados y cocidos al tandoor.',
    price: 12900, image_url: null, is_active: true,
    dietary_tags: [], allergens: [],
  },
  {
    id: 'item-e14', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Tandoori Lamb Chop',
    description: 'Costilla de cordero cocinada en tandoor con finas especias indias.',
    price: 21600, image_url: null, is_active: true,
    dietary_tags: [], allergens: ['dairy'],
  },
  {
    id: 'item-e15', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Bindi Oysters',
    description: 'Frescos ostiones (6) con un toque de tamarindo, cubiertos en puré de coliflor y acompañados de okra crujiente.',
    price: 21000, image_url: null, is_active: true,
    dietary_tags: [], allergens: ['shellfish'],
  },
  {
    id: 'item-e16', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Chicken Lollipop 65',
    description: 'Trutros de pollo marinados en especias al estilo indio.',
    price: 9700, image_url: null, is_active: true,
    dietary_tags: ['spicy'], allergens: ['gluten'],
  },

  // ── VEGETARIANO ─────────────────────────────────────────────────────────────

  {
    id: 'item-v01', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Achari Bengan',
    description: 'Berenjena macerada en pickle de mango. Sabor ácido picante.',
    price: 12900, image_url: '/images/menu/achari-bengan.jpg', is_active: true,
    dietary_tags: ['vegan', 'spicy'], allergens: [],
  },
  {
    id: 'item-v02', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Aloo Korma',
    description: 'Papas en salsa de castañas de cajú y un toque aromático de cardamomo.',
    price: 13000, image_url: '/images/menu/aloo-korma.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['nuts', 'dairy'],
  },
  {
    id: 'item-v03', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Aloo Matar Aur Gobhi',
    description: 'Deliciosas papas con arveja y coliflor en massala, condimentadas al estilo tradicional hindú, con una salsa de cebolla y tomate.',
    price: 10900, image_url: '/images/menu/aloo-matar-aur-gobhi.jpg', is_active: true,
    dietary_tags: ['vegan'], allergens: [],
  },
  {
    id: 'item-v04', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Angoori Khumb Aur Matar',
    description: 'Frescos champiñones y arvejas en una cremosa salsa de cebolla con especias.',
    price: 11700, image_url: '/images/menu/angoori-khumb-aur-matar.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['dairy'],
  },
  {
    id: 'item-v05', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Chana Pindi Batura',
    description: 'Garbanzos en masala servido con cebolla al puro estilo "street food" con bhatura (masa frita).',
    price: 14400, image_url: '/images/menu/chana-pindi-batura.jpg', is_active: true,
    dietary_tags: ['vegan'], allergens: ['gluten'],
  },
  {
    id: 'item-v06', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Dal Makhani',
    description: 'Típico plato indio cremoso con tres tipos de lentejas cocinadas en mantequilla y especias indias.',
    price: 14900, image_url: '/images/menu/dal-makhani.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['dairy'],
  },
  {
    id: 'item-v07', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Dal Tadka',
    description: 'Lentejas rojas en crema al curry y especias indias.',
    price: 9700, image_url: '/images/menu/dal-tadka.jpg', is_active: true,
    dietary_tags: ['vegan'], allergens: [],
  },
  {
    id: 'item-v08', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Kadai Paneer Tikka Masala',
    description: 'Queso indio cocinado al tandoor, luego salteado en salsa de tomate, cebolla y masala con juliana de pimentón y cebolla.',
    price: 16000, image_url: '/images/menu/kadai-paneer-tikka-masala.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['dairy'],
  },
  {
    id: 'item-v09', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Lahsuni Saag Paneer',
    description: 'Exótica salsa de espinacas con ajo cocinada al estilo indio con queso indio hecho en casa.',
    price: 15300, image_url: '/images/menu/lahsuni-saag-paneer.jpg', is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-v10', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Malai Kofta',
    description: 'Croquetas rellenas con frutos secos y queso indio en una delicada salsa dulce de cajú y massala.',
    price: 13900, image_url: '/images/menu/malai-kofta.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['nuts', 'dairy'],
  },
  {
    id: 'item-v11', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Mattar Paneer',
    description: 'Plato vegetariano del norte de la India: arvejas y queso hecho en casa (paneer) en salsa de tomate con garam massala.',
    price: 13000, image_url: '/images/menu/mattar-paneer.jpg', is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-v12', category_id: 'cat-veg', business_id: 'providencia',
    name: 'Veshnu Masala',
    description: 'Guiso de verduras (coliflor, papa, champiñón, arveja, zanahoria, choclo) en cremosa salsa de cebolla y tomate.',
    price: 12800, image_url: '/images/menu/veshnu-masala.jpg', is_active: true,
    dietary_tags: ['vegan', 'gluten-free'], allergens: [],
  },

  // ── POLLO ────────────────────────────────────────────────────────────────────

  {
    id: 'item-p01', category_id: 'cat-pollo', business_id: 'providencia',
    name: 'Butter Chicken',
    description: 'Pollo en crema de tomate cocinado en mantequilla y masala.',
    price: 15200, image_url: '/images/menu/butter-chicken.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-p02', category_id: 'cat-pollo', business_id: 'providencia',
    name: 'Karay Murgh Tikka Masala',
    description: 'Especiado pollo en salsa tikka con masala y pimentón.',
    price: 16800, image_url: '/images/menu/karay-murgh-tikka-masala.jpg', is_active: true,
    dietary_tags: ['spicy', 'gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-p03', category_id: 'cat-pollo', business_id: 'providencia',
    name: 'Lasuni Saag Murgh',
    description: 'Pollo en salsa de espinacas con ajo cocinada al estilo indio con mucho masala.',
    price: 15800, image_url: '/images/menu/lasuni-saag-murgh.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-p04', category_id: 'cat-pollo', business_id: 'providencia',
    name: 'Murgh Adraki',
    description: 'Pollo en delicada salsa de cebolla con jengibre rallado.',
    price: 15200, image_url: '/images/menu/murgh-adraki.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: [],
  },
  {
    id: 'item-p05', category_id: 'cat-pollo', business_id: 'providencia',
    name: 'Murgh Curry',
    description: 'Tradicional plato indio de pollo con salsa de curry y masala.',
    price: 15200, image_url: '/images/menu/murgh-curry.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: [],
  },
  {
    id: 'item-p06', category_id: 'cat-pollo', business_id: 'providencia',
    name: 'Murgh Kali Mitch',
    description: 'Pollo en salsa blanca con castañas de cajú y pimienta.',
    price: 17000, image_url: '/images/menu/murgh-kali-mitch.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['nuts', 'dairy'],
  },
  {
    id: 'item-p07', category_id: 'cat-pollo', business_id: 'providencia',
    name: 'Murgh Mitha Suthra',
    description: 'Pollo macerado en deliciosa crema de almendra, coco y masala. Sabor dulce.',
    price: 17000, image_url: '/images/menu/murgh-mitha-suthra.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['nuts', 'dairy'],
  },
  {
    id: 'item-p08', category_id: 'cat-pollo', business_id: 'providencia',
    name: 'Murgh Nilgiri',
    description: 'Pollo al estilo sur de la India (montañas Nilgiri): mezcla de coco, menta y cilantro. Sabor cremoso.',
    price: 17100, image_url: '/images/menu/murgh-nilgiri.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-p09', category_id: 'cat-pollo', business_id: 'providencia',
    name: 'Murgh Punjabi',
    description: 'Pollo condimentado al estilo indio en dos tipos de salsas: tomate, cebolla, masala y aliño especial Kasturi Methi.',
    price: 16800, image_url: '/images/menu/murgh-punjabi.jpg', is_active: true,
    dietary_tags: ['spicy', 'gluten-free'], allergens: [],
  },
  {
    id: 'item-p10', category_id: 'cat-pollo', business_id: 'providencia',
    name: 'Murgh Tawa Masala',
    description: 'Pollo con pimentón, cebolla y masala servido en plancha hindú (tawa).',
    price: 16900, image_url: '/images/menu/murgh-curry.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: [],
  },
  {
    id: 'item-p11', category_id: 'cat-pollo', business_id: 'providencia',
    name: 'Achari Murgh Tikka Masala',
    description: 'Pollo tandoori en salsa tikka con masala, salsa de paprika y achari (ácido picante).',
    price: 16400, image_url: '/images/menu/achari-murgh-tikka-masala.jpg', is_active: true,
    dietary_tags: ['spicy'], allergens: ['dairy'],
  },

  // ── PESCADOS Y MARISCOS ──────────────────────────────────────────────────────

  {
    id: 'item-m01', category_id: 'cat-mar', business_id: 'providencia',
    name: 'Chapati Kekrey',
    description: 'Jaiba en salsa de tomate con frito de cebolla y especias indias.',
    price: 16900, image_url: null, is_active: true,
    dietary_tags: [], allergens: ['shellfish'],
  },
  {
    id: 'item-m02', category_id: 'cat-mar', business_id: 'providencia',
    name: 'Goa Jheenga Curry',
    description: 'Camarones ecuatorianos en salsa al curry, cebolla, ajo, coco y especias. Recomendado con arroz basmati.',
    price: 19100, image_url: '/images/menu/goa-jheenga-curry.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['shellfish'],
  },
  {
    id: 'item-m03', category_id: 'cat-mar', business_id: 'providencia',
    name: 'Goa Machi Curry',
    description: 'Pescado en salsa al curry, cebolla, ajo, coco y especias. Recomendado con arroz basmati.',
    price: 17700, image_url: null, is_active: true,
    dietary_tags: ['gluten-free'], allergens: [],
  },
  {
    id: 'item-m04', category_id: 'cat-mar', business_id: 'providencia',
    name: 'Jheenga Masaledar',
    description: 'Afrodisíaco plato con camarones condimentados al puro estilo indio en salsa de tomate, cebolla y masala. Aliño especial Kasturi Methi.',
    price: 18600, image_url: '/images/menu/jheenga-masaledar.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['shellfish'],
  },
  {
    id: 'item-m05', category_id: 'cat-mar', business_id: 'providencia',
    name: 'Jheenga Mitha Sutra',
    description: 'Camarones ecuatorianos en dulce salsa de almendras, coco y curry.',
    price: 20900, image_url: '/images/menu/jheenga-mitha-sutra.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['shellfish', 'nuts'],
  },
  {
    id: 'item-m06', category_id: 'cat-mar', business_id: 'providencia',
    name: 'Jheenga Punjabi',
    description: 'Afrodisíaco plato con camarones condimentados al estilo indio en dos tipos de salsa, tomate, cebolla y masala más aliño especial Kasturi Methi.',
    price: 18700, image_url: '/images/menu/jheenga-punjabi.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['shellfish'],
  },
  {
    id: 'item-m07', category_id: 'cat-mar', business_id: 'providencia',
    name: 'Jheenga Tawa Masala',
    description: 'Camarón con pimentón, cebolla y masala servido en plancha hindú (tawa).',
    price: 18000, image_url: '/images/menu/jheenga-masaledar.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['shellfish'],
  },

  // ── CORDERO ──────────────────────────────────────────────────────────────────

  {
    id: 'item-c01', category_id: 'cat-cordero', business_id: 'providencia',
    name: 'Balti Gosht',
    description: 'Cordero magallánico en salsa de cebolla con tomate y especias, servido en balde (Balti).',
    price: 21100, image_url: '/images/menu/balti-gosht.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: [],
  },
  {
    id: 'item-c02', category_id: 'cat-cordero', business_id: 'providencia',
    name: 'French Rack de Cordero',
    description: 'Costilla francesa de cordero magallánico acompañada de verduras sobre suave curry especiado.',
    price: 23900, image_url: null, is_active: true,
    dietary_tags: ['gluten-free'], allergens: [],
  },
  {
    id: 'item-c03', category_id: 'cat-cordero', business_id: 'providencia',
    name: 'Mathan Josh Curry',
    description: 'Cordero magallánico macerado en salsa de cebolla con finas especias indias y bastante masala.',
    price: 21100, image_url: '/images/menu/mathan-josh-curry.jpg', is_active: true,
    dietary_tags: ['spicy', 'gluten-free'], allergens: [],
  },
  {
    id: 'item-c04', category_id: 'cat-cordero', business_id: 'providencia',
    name: 'Mathan Nilgiri',
    description: 'Cordero magallánico al estilo sur de la India: mezcla de coco, menta y cilantro. Sabor cremoso picante.',
    price: 21100, image_url: '/images/menu/mathan-nilgiri.jpg', is_active: true,
    dietary_tags: ['spicy', 'gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-c05', category_id: 'cat-cordero', business_id: 'providencia',
    name: 'Garrón 18 Horas',
    description: 'Tierno y jugoso garrón cocinado lentamente por más de 18 horas en una mezcla de especias tradicionales de la India. Acompáñalo con el curry que más te guste.',
    price: 34900, image_url: null, is_active: true,
    dietary_tags: ['gluten-free'], allergens: [],
  },

  // ── DEL TANDOOR ──────────────────────────────────────────────────────────────

  {
    id: 'item-t01', category_id: 'cat-tandoor', business_id: 'providencia',
    name: 'Murgh Reshmi Kabab',
    description: 'Pollo en salsa Reshmi (crema, cúrcuma, azafrán) cocinado al tandoor.',
    price: 16900, image_url: '/images/menu/murgh-reshmi-kabab.jpg', is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-t02', category_id: 'cat-tandoor', business_id: 'providencia',
    name: 'Murgh Tandoori',
    description: 'Truto de pollo con salsa tikka al tandoor.',
    price: 13700, image_url: null, is_active: true,
    dietary_tags: [], allergens: ['dairy'],
  },
  {
    id: 'item-t03', category_id: 'cat-tandoor', business_id: 'providencia',
    name: 'Murgh Tikka Pahadi',
    description: 'Especiado pollo cocinado al tandoor con bastante cilantro. Sabor ahumado.',
    price: 16000, image_url: null, is_active: true,
    dietary_tags: ['spicy'], allergens: ['dairy'],
  },
  {
    id: 'item-t04', category_id: 'cat-tandoor', business_id: 'providencia',
    name: 'Tandoori Mix',
    description: 'Mezcla de los kabbabs de la casa. La mejor selección para compartir.',
    price: 27400, image_url: '/images/menu/tandoori-mix.jpg', is_active: true,
    dietary_tags: [], allergens: ['dairy'],
  },

  // ── RISHTEDAR 305 ────────────────────────────────────────────────────────────

  {
    id: 'item-305-01', category_id: 'cat-305', business_id: 'providencia',
    name: 'Rishtedar 305 Paneer',
    description: 'Paneer crujiente con lechuga, tomate, cebolla, mayonesa y chutney de menta.',
    price: 12000, image_url: '/images/menu/butter-chicken-crispy-sandwich.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['gluten', 'dairy', 'eggs'],
  },
  {
    id: 'item-305-02', category_id: 'cat-305', business_id: 'providencia',
    name: 'Rishtedar 305 Chicken',
    description: 'Pollo crispy con salsa de butter chicken, queso fundido, cebolla y pepinillos.',
    price: 11300, image_url: '/images/menu/butter-chicken-crispy-sandwich.jpg', is_active: true,
    dietary_tags: [], allergens: ['gluten', 'dairy'],
  },
  {
    id: 'item-305-03', category_id: 'cat-305', business_id: 'providencia',
    name: 'Rishtedar 305 Jheenga',
    description: 'Mix de verdes con camarón apanado en semillas de sésamo y piña asada. Opción vegetariana: paneer en lugar de camarón.',
    price: 13700, image_url: '/images/menu/butter-chicken-crispy-sandwich.jpg', is_active: true,
    dietary_tags: [], allergens: ['shellfish', 'gluten'],
  },
  {
    id: 'item-305-04', category_id: 'cat-305', business_id: 'providencia',
    name: 'Rishtedar 305 Bengan',
    description: 'Berenjena apanada, salsa achari, tomate, lechuga, cebolla y mayonesa. Incluye porción de papas fritas.',
    price: 10300, image_url: '/images/menu/butter-chicken-crispy-sandwich.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['gluten', 'eggs'],
  },
  {
    id: 'item-305-05', category_id: 'cat-305', business_id: 'providencia',
    name: 'Rishtedar 305 Murgh Tikka',
    description: 'Pollo murgh tikka, tomate, palta y mayonesa.',
    price: 12600, image_url: '/images/menu/butter-chicken-crispy-sandwich.jpg', is_active: true,
    dietary_tags: [], allergens: ['gluten', 'eggs'],
  },

  // ── PAN NAAN ─────────────────────────────────────────────────────────────────

  {
    id: 'item-n01', category_id: 'cat-naan', business_id: 'providencia',
    name: 'Cheese Naan',
    description: 'Pan indio al tandoor con queso.',
    price: 4900, image_url: '/images/menu/cheese-naan.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['gluten', 'dairy'],
  },
  {
    id: 'item-n02', category_id: 'cat-naan', business_id: 'providencia',
    name: 'Lasun Naan',
    description: 'Pan indio al tandoor con ajo.',
    price: 2900, image_url: '/images/menu/lasun-naan.jpg', is_active: true,
    dietary_tags: ['vegan'], allergens: ['gluten'],
  },
  {
    id: 'item-n03', category_id: 'cat-naan', business_id: 'providencia',
    name: 'Plain Naan',
    description: 'Pan tradicional indio al tandoor.',
    price: 2500, image_url: '/images/menu/naan.jpg', is_active: true,
    dietary_tags: ['vegan'], allergens: ['gluten'],
  },
  {
    id: 'item-n04', category_id: 'cat-naan', business_id: 'providencia',
    name: 'Pyaz Naan',
    description: 'Típico pan de la India con cebolla y cilantro picado.',
    price: 3900, image_url: '/images/menu/naan.jpg', is_active: true,
    dietary_tags: ['vegan'], allergens: ['gluten'],
  },
  {
    id: 'item-n05', category_id: 'cat-naan', business_id: 'providencia',
    name: 'Till Dania Naan',
    description: 'Pan indio al tandoor con sésamo y cilantro.',
    price: 3900, image_url: '/images/menu/till-dania-naan.jpg', is_active: true,
    dietary_tags: ['vegan'], allergens: ['gluten'],
  },

  // ── ARROCES & BIRYANIS ───────────────────────────────────────────────────────

  {
    id: 'item-a01', category_id: 'cat-arroz', business_id: 'providencia',
    name: 'Basmati Rice',
    description: 'Arroz de la India de grano largo y aromático, cocinado con especias.',
    price: 4500, image_url: '/images/menu/arroz-basmati.jpg', is_active: true,
    dietary_tags: ['vegan', 'gluten-free'], allergens: [],
  },
  {
    id: 'item-a02', category_id: 'cat-arroz', business_id: 'providencia',
    name: 'Jheenga Biryani',
    description: 'Arroz basmati con camarones y especias aromáticas de la India.',
    price: 18100, image_url: null, is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['shellfish'],
  },
  {
    id: 'item-a03', category_id: 'cat-arroz', business_id: 'providencia',
    name: 'Kashmiri Pulao',
    description: 'Arroz basmati con frutas y especias.',
    price: 7500, image_url: '/images/menu/kashmiri-pulao.jpg', is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['nuts'],
  },
  {
    id: 'item-a04', category_id: 'cat-arroz', business_id: 'providencia',
    name: 'Masala Fries',
    description: 'Papas fritas sazonadas con especias indias.',
    price: 4600, image_url: null, is_active: true,
    dietary_tags: ['vegan', 'gluten-free'], allergens: [],
  },
  {
    id: 'item-a05', category_id: 'cat-arroz', business_id: 'providencia',
    name: 'Murgh Biryani',
    description: 'Arroz basmati con pollo y especias indias.',
    price: 16900, image_url: null, is_active: true,
    dietary_tags: ['gluten-free'], allergens: [],
  },
  {
    id: 'item-a06', category_id: 'cat-arroz', business_id: 'providencia',
    name: 'Lemon Rice',
    description: 'Arroz basmati con curry, semillas de mostaza y un toque ácido.',
    price: 6500, image_url: '/images/menu/nimboo-baath.jpg', is_active: true,
    dietary_tags: ['vegan', 'gluten-free'], allergens: [],
  },
  {
    id: 'item-a07', category_id: 'cat-arroz', business_id: 'providencia',
    name: 'Veg Biryani',
    description: 'Arroz basmati con vegetales, paneer y especias indias.',
    price: 14900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy'],
  },

  // ── POSTRES ───────────────────────────────────────────────────────────────────

  {
    id: 'item-post01', category_id: 'cat-postres', business_id: 'providencia',
    name: 'Cheesecake de Pistacho',
    description: 'Cheesecake de pistacho con espuma de naranja y un toque de azafrán.',
    price: 7900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['gluten', 'dairy', 'nuts', 'eggs'],
  },
  {
    id: 'item-post02', category_id: 'cat-postres', business_id: 'providencia',
    name: 'Gulab Jamun',
    description: 'Dulces bolitas de almidón de leche maceradas en agua de rosas con azafrán.',
    price: 5900, image_url: '/images/menu/gulab-jamu.jpg', is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['gluten', 'dairy'],
  },
  {
    id: 'item-post03', category_id: 'cat-postres', business_id: 'providencia',
    name: 'Mousse India-Chile',
    description: 'Manjar, café y cardamomo en mousse, coronado con gulab jamun, chocolate amargo y pistachos. India y Chile en una cucharada.',
    price: 6900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['dairy', 'nuts', 'eggs'],
  },
  {
    id: 'item-post04', category_id: 'cat-postres', business_id: 'providencia',
    name: 'Kulfi',
    description: 'Helado indio hecho en casa con almendra, pistacho y mango.',
    price: 5900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy', 'nuts'],
  },
  {
    id: 'item-post05', category_id: 'cat-postres', business_id: 'providencia',
    name: 'Plátano Frito',
    description: 'Plátano frito con helado tradicional.',
    price: 5900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy'],
  },

  // ── MENÚ KIDS ─────────────────────────────────────────────────────────────────

  {
    id: 'item-k01', category_id: 'cat-kids', business_id: 'providencia',
    name: 'Nuggets de Pollo',
    description: 'Nuggets de pollo apanados en una ligera masa de garbanzo.',
    price: 9800, image_url: null, is_active: true,
    dietary_tags: [], allergens: ['gluten'],
  },
  {
    id: 'item-k02', category_id: 'cat-kids', business_id: 'providencia',
    name: 'Mini Sandwich de Pollo',
    description: 'Mini sándwich de pollo apanado en harina de garbanzo, ketchup, queso laminado, tomate y lechuga. Incluye porción de papas fritas.',
    price: 11600, image_url: '/images/menu/butter-chicken-crispy-sandwich.jpg', is_active: true,
    dietary_tags: [], allergens: ['gluten', 'dairy'],
  },

  // ── BEBIDAS ───────────────────────────────────────────────────────────────────

  {
    id: 'item-b01', category_id: 'cat-bebidas', business_id: 'providencia',
    name: 'Mango Lassi',
    description: 'Bebida tradicional de la India a base de yogur y mango.',
    price: 6900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-b02', category_id: 'cat-bebidas', business_id: 'providencia',
    name: 'Masala Chai',
    description: 'Té negro con leche, cardamomo, jengibre y especias aromáticas indias.',
    price: 4900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-b03', category_id: 'cat-bebidas', business_id: 'providencia',
    name: 'Rishtedar Madira (Gin)',
    description: 'Gin infusionado en cardamomo, mango y limón. Firma de la casa.',
    price: 8600, image_url: null, is_active: true,
    dietary_tags: [], allergens: [],
  },
  {
    id: 'item-b04', category_id: 'cat-bebidas', business_id: 'providencia',
    name: 'Mocktail Cúrcuma',
    description: 'Cúrcuma, té con manzana y ginger ale. Refrescante y sin alcohol.',
    price: 9900, image_url: null, is_active: true,
    dietary_tags: ['vegan', 'gluten-free'], allergens: [],
  },
  {
    id: 'item-b05', category_id: 'cat-bebidas', business_id: 'providencia',
    name: 'Agua Mineral',
    description: 'Agua mineral con o sin gas.',
    price: 3700, image_url: null, is_active: true,
    dietary_tags: ['vegan', 'gluten-free'], allergens: [],
  },
  {
    id: 'item-b06', category_id: 'cat-bebidas', business_id: 'providencia',
    name: 'Jugo Natural',
    description: 'Jugos de fruta natural o pulpa de frutas de temporada.',
    price: 4900, image_url: null, is_active: true,
    dietary_tags: ['vegan', 'gluten-free'], allergens: [],
  },
]

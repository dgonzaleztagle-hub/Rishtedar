import type { MenuCategory, MenuItem } from '@/types'

export const DEMO_CATEGORIES: MenuCategory[] = [
  { id: 'cat-entradas', business_id: 'providencia', name: 'Entradas', order: 1 },
  { id: 'cat-principales', business_id: 'providencia', name: 'Platos principales', order: 2 },
  { id: 'cat-tandoor', business_id: 'providencia', name: 'Del Tandoor', order: 3 },
  { id: 'cat-biryani', business_id: 'providencia', name: 'Biryanis', order: 4 },
  { id: 'cat-vegetariano', business_id: 'providencia', name: 'Vegetariano', order: 5 },
  { id: 'cat-postres', business_id: 'providencia', name: 'Postres', order: 6 },
  { id: 'cat-bebidas', business_id: 'providencia', name: 'Bebidas', order: 7 },
]

export const DEMO_MENU_ITEMS: MenuItem[] = [
  // Entradas
  {
    id: 'item-001', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Samosas', description: 'Triángulos crujientes rellenos de papa y guisantes especiados. Servidos con chutney de menta y tamarindo.',
    price: 7900, image_url: null, is_active: true,
    dietary_tags: ['vegan'], allergens: ['gluten'],
  },
  {
    id: 'item-002', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Pakoras de verduras', description: 'Buñuelos de vegetales de temporada en masa de harina de garbanzo, con especias aromáticas.',
    price: 7500, image_url: null, is_active: true,
    dietary_tags: ['vegan', 'gluten-free'], allergens: [],
  },
  {
    id: 'item-003', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Paneer Tikka', description: 'Queso fresco marinado en yogur y especias, asado en horno tandoor de arcilla. Un clásico irresistible.',
    price: 11900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-004', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Seekh Kebab', description: 'Brochetas de cordero molido con especias y hierbas frescas, asadas en el tandoor. Servidas con chutney.',
    price: 12900, image_url: null, is_active: true,
    dietary_tags: [], allergens: [],
  },
  {
    id: 'item-005', category_id: 'cat-entradas', business_id: 'providencia',
    name: 'Tabla de entradas', description: 'Selección del chef: samosas, pakoras, paneer tikka y seekh kebab. Ideal para compartir.',
    price: 19900, image_url: null, is_active: true,
    dietary_tags: [], allergens: ['gluten', 'dairy'],
  },

  // Platos principales
  {
    id: 'item-011', category_id: 'cat-principales', business_id: 'providencia',
    name: 'Butter Chicken', description: 'Pollo tierno marinado en yogur, asado en tandoor y bañado en salsa cremosa de tomate y mantequilla clarificada. El favorito de todos.',
    price: 13900, image_url: null, is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-012', category_id: 'cat-principales', business_id: 'providencia',
    name: 'Lamb Rogan Josh', description: 'Cordero braseado lentamente con especias aromáticas de Cachemira, chile kashmiri y madera dulce. Una receta de generaciones.',
    price: 16900, image_url: null, is_active: true,
    dietary_tags: ['gluten-free', 'spicy'], allergens: [],
  },
  {
    id: 'item-013', category_id: 'cat-principales', business_id: 'providencia',
    name: 'Chicken Tikka Masala', description: 'Pollo asado en tandoor sobre una salsa masala especiada con tomate, crema y una mezcla aromática única.',
    price: 13900, image_url: null, is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-014', category_id: 'cat-principales', business_id: 'providencia',
    name: 'Goan Fish Curry', description: 'Filete de pescado en salsa de coco con especias de Goa: cúrcuma, mostaza, curry verde y kokum agridulce.',
    price: 15900, image_url: null, is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['shellfish', 'dairy'],
  },
  {
    id: 'item-015', category_id: 'cat-principales', business_id: 'providencia',
    name: 'Prawn Masala', description: 'Langostinos jumbo salteados con cebolla, tomate y una mezcla de especias costeras. Picante y fragante.',
    price: 17900, image_url: null, is_active: true,
    dietary_tags: ['gluten-free', 'spicy'], allergens: ['shellfish'],
  },

  // Del Tandoor
  {
    id: 'item-021', category_id: 'cat-tandoor', business_id: 'providencia',
    name: 'Pollo Tandoori', description: 'Pollo entero marinado 24 horas en yogur y especias, asado en nuestro horno tandoor a 480°C. Acompañado de raita y chutney.',
    price: 14900, image_url: null, is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-022', category_id: 'cat-tandoor', business_id: 'providencia',
    name: 'Naan mantequilla', description: 'Pan plano tradicional horneado en las paredes del tandoor. Tierno, suave y con mantequilla al servir.',
    price: 3500, image_url: null, is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['gluten', 'dairy'],
  },
  {
    id: 'item-023', category_id: 'cat-tandoor', business_id: 'providencia',
    name: 'Naan de ajo y cilantro', description: 'Nuestro clásico naan con ajo tostado y cilantro fresco. Perfecto para acompañar cualquier curry.',
    price: 3900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['gluten', 'dairy'],
  },
  {
    id: 'item-024', category_id: 'cat-tandoor', business_id: 'providencia',
    name: 'Paratha integral', description: 'Pan de trigo integral de varias capas, horneado en tandoor. Tradición norteña de India.',
    price: 3500, image_url: null, is_active: true,
    dietary_tags: ['vegan'], allergens: ['gluten'],
  },

  // Biryanis
  {
    id: 'item-031', category_id: 'cat-biryani', business_id: 'providencia',
    name: 'Biryani de Cordero', description: 'Arroz basmati de larga maduración cocinado con cordero y una mezcla de especias que incluye azafrán, cardamomo y canela.',
    price: 15900, image_url: null, is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['nuts'],
  },
  {
    id: 'item-032', category_id: 'cat-biryani', business_id: 'providencia',
    name: 'Biryani de Pollo', description: 'Clásico biryani de pollo con especias enteras, capas de arroz y la fragancia del azafrán.',
    price: 13900, image_url: null, is_active: true,
    dietary_tags: ['gluten-free'], allergens: ['nuts'],
  },
  {
    id: 'item-033', category_id: 'cat-biryani', business_id: 'providencia',
    name: 'Biryani Vegetariano', description: 'Vegetales de estación, paneer y arroz basmati cocinados en olla sellada con masa. Fragante y abundante.',
    price: 11900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy', 'nuts'],
  },

  // Vegetariano
  {
    id: 'item-041', category_id: 'cat-vegetariano', business_id: 'providencia',
    name: 'Dal Makhani', description: 'Lentejas negras cocinadas lentamente durante 12 horas con tomates, jengibre y mantequilla clarificada. El plato favorito de Delhi.',
    price: 9900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-042', category_id: 'cat-vegetariano', business_id: 'providencia',
    name: 'Palak Paneer', description: 'Queso fresco en salsa cremosa de espinacas, con jengibre y especias suaves. Uno de los platos más tradicionales de India.',
    price: 10900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-043', category_id: 'cat-vegetariano', business_id: 'providencia',
    name: 'Chana Masala', description: 'Garbanzos en salsa de tomate y especias con cilantro fresco. Plato vegano del Punjab.',
    price: 9500, image_url: null, is_active: true,
    dietary_tags: ['vegan', 'gluten-free'], allergens: [],
  },

  // Postres
  {
    id: 'item-051', category_id: 'cat-postres', business_id: 'providencia',
    name: 'Gulab Jamun', description: 'Bolitas de leche deshidratada fritas en ghee, bañadas en almíbar de rosas y cardamomo. Un clásico irresistible.',
    price: 5900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['dairy', 'gluten'],
  },
  {
    id: 'item-052', category_id: 'cat-postres', business_id: 'providencia',
    name: 'Kulfi de Mango', description: 'Helado tradicional indio de mango Alphonso, con pistachos molidos y agua de rosas.',
    price: 5500, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy', 'nuts'],
  },
  {
    id: 'item-053', category_id: 'cat-postres', business_id: 'providencia',
    name: 'Kheer de arroz', description: 'Arroz cremoso cocinado en leche entera con azafrán, cardamomo y almendras laminadas.',
    price: 5500, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy', 'nuts'],
  },

  // Bebidas
  {
    id: 'item-061', category_id: 'cat-bebidas', business_id: 'providencia',
    name: 'Mango Lassi', description: 'Batido de yogur y mango Alphonso con una pizca de cardamomo. Refrescante y suavizador del picante.',
    price: 4900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian', 'gluten-free'], allergens: ['dairy'],
  },
  {
    id: 'item-062', category_id: 'cat-bebidas', business_id: 'providencia',
    name: 'Masala Chai', description: 'Té negro especiado con jengibre, cardamomo, canela y clavo. Servido con leche entera.',
    price: 3900, image_url: null, is_active: true,
    dietary_tags: ['vegetarian'], allergens: ['dairy'],
  },
]

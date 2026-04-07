import type { Business } from '@/types'

export const LOCATIONS: Business[] = [
  {
    id: 'providencia',
    name: 'Rishtedar Providencia',
    slug: 'providencia',
    address: 'Av. Holanda 160, Providencia',
    phone: '+56 2 3230 1278',
    email: 'holanda@rishtedar.com',
    latitude: -33.4272,
    longitude: -70.6259,
    hours_json: {
      lun: '12:00–23:00', mar: '12:00–23:00', mie: '12:00–23:00',
      jue: '12:00–23:00', vie: '12:30–23:30', sab: '12:30–23:30',
      dom: '12:30–22:30',
    },
    image_url: null,
    google_place_id: null,
    country: 'CL',
    is_active: true,
  },
  {
    id: 'vitacura',
    name: 'Rishtedar Vitacura',
    slug: 'vitacura',
    address: 'Av. Vitacura 5461, Vitacura',
    phone: '+56 2 3204 0981',
    email: 'vitacura@rishtedar.com',
    latitude: -33.3985,
    longitude: -70.5870,
    hours_json: {
      lun: '12:00–23:00', mar: '12:00–23:00', mie: '12:00–23:00',
      jue: '12:00–23:00', vie: '12:30–23:30', sab: '12:30–23:30',
      dom: '12:30–22:30',
    },
    image_url: null,
    google_place_id: null,
    country: 'CL',
    is_active: true,
  },
  {
    id: 'la-reina',
    name: 'Rishtedar La Reina',
    slug: 'la-reina',
    address: 'Av. Príncipe de Gales 6500, La Reina',
    phone: '+56 2 3235 9977',
    email: 'lareina@rishtedar.com',
    latitude: -33.4503,
    longitude: -70.5567,
    hours_json: {
      lun: '12:00–23:00', mar: '12:00–23:00', mie: '12:00–23:00',
      jue: '12:00–23:00', vie: '12:30–23:30', sab: '12:30–23:30',
      dom: '12:30–22:30',
    },
    image_url: null,
    google_place_id: null,
    country: 'CL',
    is_active: true,
  },
  {
    id: 'la-dehesa',
    name: 'Rishtedar La Dehesa',
    slug: 'la-dehesa',
    address: 'El Rodeo 12850, Local 74 y 75, Lo Barnechea',
    phone: '+56 2 3345 4142',
    email: 'ladehesa@rishtedar.com',
    latitude: -33.3588,
    longitude: -70.5178,
    hours_json: {
      lun: '12:00–23:00', mar: '12:00–23:00', mie: '12:00–23:00',
      jue: '12:00–23:00', vie: '12:00–23:30', sab: '12:00–23:30',
      dom: '12:00–22:30',
    },
    image_url: null,
    google_place_id: null,
    country: 'CL',
    is_active: true,
  },
  {
    id: 'miami-wynwood',
    name: 'Rishtedar Miami',
    slug: 'miami-wynwood',
    address: 'Wynwood, Miami, FL',
    phone: '+1 305 000 0000',
    email: 'miami@rishtedar.com',
    latitude: 25.8002,
    longitude: -80.1998,
    hours_json: {
      lun: '12:00–23:00', mar: '12:00–23:00', mie: '12:00–23:00',
      jue: '12:00–23:00', vie: '12:00–00:00', sab: '12:00–00:00',
      dom: '12:00–22:00',
    },
    image_url: null,
    google_place_id: null,
    country: 'US',
    is_active: true,
  },
]

export const DAYS_ES: Record<string, string> = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
  jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo',
}

export function getLocationBySlug(slug: string): Business | undefined {
  return LOCATIONS.find(l => l.slug === slug)
}

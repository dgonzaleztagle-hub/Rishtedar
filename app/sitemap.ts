import type { MetadataRoute } from 'next'
import { LOCATIONS } from '@/lib/locations'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rishtedar.cl'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/menu`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/locales`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/reservar`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/order`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/eventos`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/search`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const locationRoutes: MetadataRoute.Sitemap = LOCATIONS.map(loc => ({
    url: `${BASE_URL}/locales/${loc.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...locationRoutes]
}

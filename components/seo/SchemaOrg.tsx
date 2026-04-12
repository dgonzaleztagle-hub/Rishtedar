import { LOCATIONS } from '@/lib/locations'

function buildHoursSchema(hours: Record<string, string>) {
  const dayMap: Record<string, string> = {
    lun: 'Monday', mar: 'Tuesday', mie: 'Wednesday',
    jue: 'Thursday', vie: 'Friday', sab: 'Saturday', dom: 'Sunday',
  }

  return Object.entries(hours).map(([key, value]) => {
    const day = dayMap[key]
    if (!day || !value) return null
    const [open, close] = value.split('–')
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${day}`,
      opens: open?.trim() ?? '12:00',
      closes: close?.trim() ?? '23:00',
    }
  }).filter(Boolean)
}

export function SchemaOrg() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rishtedar.cl'

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'Rishtedar',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      'https://instagram.com/rishtedar',
      'https://facebook.com/rishtedar',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'reservations',
      url: `${baseUrl}/reservar`,
    },
  }

  const restaurantsSchema = LOCATIONS.map(loc => ({
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${baseUrl}/locales/${loc.slug}/#restaurant`,
    name: loc.name,
    image: loc.image_url ?? `${baseUrl}/og-image.jpg`,
    url: `${baseUrl}/locales/${loc.slug}`,
    telephone: loc.phone,
    email: loc.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: loc.address,
      addressCountry: loc.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: loc.latitude,
      longitude: loc.longitude,
    },
    servesCuisine: 'Indian',
    priceRange: '$$',
    openingHoursSpecification: buildHoursSchema(loc.hours_json as Record<string, string>),
    parentOrganization: { '@id': `${baseUrl}/#organization` },
    hasMenu: `${baseUrl}/menu`,
    acceptsReservations: true,
  }))

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: 'Rishtedar',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const schemas = [organizationSchema, ...restaurantsSchema, websiteSchema]

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}

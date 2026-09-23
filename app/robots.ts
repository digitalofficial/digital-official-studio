import type { MetadataRoute } from 'next'

// Public marketing pages are crawlable; every private / client-shared surface is not.
// The per-page `robots: { index: false }` on gallery/collection/share is the real guard
// (a robots.txt Disallow is only a request); this stops well-behaved crawlers listing them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/portfolio'],
      disallow: ['/gallery/', '/collection/', '/share/', '/portal/', '/admin/', '/api/'],
    },
  }
}

import { MetadataRoute } from 'next'

/**
 * Dynamic robots.txt generation
 * Uses NEXT_PUBLIC_SITE_URL env variable as source of truth
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beyandilakademi.com').replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Prevent crawling of private/dashboard routes
        disallow: [
          '/admin/',
          '/student/',
          '/teacher/',
          '/panel/',
          '/api/',
          '/auth/',
          '/giris',
          '/kayit',
          '/sifremi-unuttum',
          '/sifre-sifirla',
          '/verify-email',
          '/pending-approval',
          '/maintenance',
          '/offline',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}

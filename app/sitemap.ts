import { MetadataRoute } from 'next'
import { getPublishedCourses } from '@/lib/actions/courses'
import { getPlatformSettings } from '@/lib/actions/settings'
import { getPublicBlogPosts } from '@/lib/actions/blog'

/**
 * Dynamic sitemap generation
 * Uses site_url from admin settings (DB) as source of truth,
 * falls back to NEXT_PUBLIC_SITE_URL env variable.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, settings, blogPosts] = await Promise.all([
    getPublishedCourses(),
    getPlatformSettings(),
    getPublicBlogPosts(),
  ])

  // Priority: DB setting → Env variable → production domain fallback
  const baseUrl = (settings?.site_url || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beyandilakademi.com').replace(/\/$/, '')

  // ── Course entries ──
  const courseEntries: MetadataRoute.Sitemap = courses.data.map((course) => ({
    url: `${baseUrl}/kurslar/${course.slug}`,
    lastModified: new Date(course.updated_at || course.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── Blog post entries ──
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${(post as any).slug}`,
    lastModified: new Date((post as any).updated_at || (post as any).published_at || (post as any).created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    // ── Core pages ──
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/programlarimiz`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/hakkimizda`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/iletisim`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/egitmen-basvuru`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // ── Dynamic course pages ──
    ...courseEntries,
    // ── Dynamic blog post pages ──
    ...blogEntries,
  ]
}

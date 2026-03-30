import './globals.css'
import { Plus_Jakarta_Sans, Playfair_Display, Lora, Inter } from 'next/font/google'

import { Providers } from './providers'
import { getPlatformSettings } from '@/lib/actions/settings'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { AuthHashHandler } from '@/app/components/AuthHashHandler'
import type { Metadata } from 'next'
import { AnalyticsWrapper } from '@/components/AnalyticsWrapper'
import { CookieConsent } from '@/components/CookieConsent'
import VisitorTracker from '@/components/VisitorTracker'

const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-jakarta',
    display: 'swap',
})

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})


const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'swap',
})

const lora = Lora({
    subsets: ['latin'],
    variable: '--font-lora',
    display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getPlatformSettings()

    const siteName = settings?.site_name || 'Beyan Dil Akademi'
    const siteUrl = (settings?.site_url || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beyandilakademi.com').replace(/\/$/, '')
    const description = settings?.site_description || 'Modern metotlarla online Arapça eğitimi. Canlı dersler ve video içeriklerle Arapça öğrenin.'
    const logoUrl = settings?.logo_url || `${siteUrl}/assets/logo-new.png`

    return {
        title: {
            default: siteName,
            template: `%s | ${siteName}`,
        },
        description,
        keywords: [
            'Arapça kursu', 'online Arapça', 'Arapça öğren', 'Arapça dersi',
            'Beyan Dil Akademi', 'canlı Arapça dersi', 'Arapça eğitimi Türkiye',
        ],
        metadataBase: new URL(siteUrl),
        alternates: {
            canonical: siteUrl,
        },
        robots: 'index, follow',
        icons: {
            icon: settings?.favicon_url || '/favicon.ico',
            shortcut: settings?.favicon_url || '/favicon.ico',
            apple: settings?.favicon_url || '/apple-touch-icon.png',
        },
        openGraph: {
            type: 'website',
            locale: 'tr_TR',
            url: siteUrl,
            siteName,
            title: siteName,
            description,
            images: [
                {
                    url: logoUrl,
                    width: 1200,
                    height: 630,
                    alt: siteName,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: siteName,
            description,
            images: [logoUrl],
        },
    }
}


export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await getPlatformSettings()

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: settings?.site_name || 'Beyan Dil Akademi',
        description: settings?.site_description || 'Online dil öğrenme platformu',
        logo: settings?.logo_url || 'https://bxkolaimlyqnevcyslkc.supabase.co/storage/v1/object/public/platform_assets/logo.png',
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: settings?.contact_phone || '',
            contactType: 'customer service'
        }
    }

    return (
        <html lang="tr" suppressHydrationWarning translate="no" className="notranslate" data-scroll-behavior="smooth">
            <head>
                <meta name="google" content="notranslate" />
                {/* PWA meta tags */}
                <meta name="application-name" content={settings?.site_name || 'Beyan Dil Akademi'} />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content={settings?.site_name || 'Beyan Dil Akademi'} />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="theme-color" content={(settings as any)?.brand_primary_color || '#204544'} />
                <link rel="apple-touch-icon" href="/assets/logo-new.png" />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
                />
                {/* Dynamic brand color injection — overrides globals.css defaults with admin-saved values */}
                {(() => {
                    const p = (settings as any)?.brand_primary_color
                    const a = (settings as any)?.brand_accent_color
                    if (!p && !a) return null

                    // Security: validate that color values are safe CSS color formats only.
                    // This prevents CSS injection (e.g. closing the style tag and injecting HTML/JS).
                    const CSS_COLOR_SAFE = /^#[0-9a-fA-F]{3,8}$|^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$|^hsl\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)$/
                    const sanitizeColor = (val: string | undefined, fallback: string): string => {
                        if (!val) return fallback
                        const trimmed = val.trim()
                        return CSS_COLOR_SAFE.test(trimmed) ? trimmed : fallback
                    }

                    const primary = sanitizeColor(p, '#204544')
                    const accent = sanitizeColor(a, '#FEDD59')
                    const css = [
                        ':root {',
                        `  --brand-primary: ${primary};`,
                        `  --brand-primary-dark: color-mix(in srgb, ${primary}, #000 15%);`,
                        `  --brand-primary-hover: color-mix(in srgb, ${primary}, #fff 12%);`,
                        `  --brand-primary-light: color-mix(in srgb, ${primary}, #fff 90%);`,
                        `  --brand-accent: ${accent};`,
                        `  --brand-accent-hover: color-mix(in srgb, ${accent}, #000 10%);`,
                        `  --color-brand-primary: ${primary};`,
                        `  --color-brand-primary-dark: color-mix(in srgb, ${primary}, #000 15%);`,
                        `  --color-brand-primary-hover: color-mix(in srgb, ${primary}, #fff 12%);`,
                        `  --color-brand-primary-light: color-mix(in srgb, ${primary}, #fff 90%);`,
                        `  --color-brand-accent: ${accent};`,
                        `  --color-brand-accent-hover: color-mix(in srgb, ${accent}, #000 10%);`,
                        '}',
                    ].join('\n')
                    return <style dangerouslySetInnerHTML={{ __html: css }} />
                })()}
            </head>
            <body className={`${jakarta.variable} ${inter.variable} ${playfair.variable} ${lora.variable} antialiased notranslate`} suppressHydrationWarning>

                {settings?.announcement_bar_enabled && settings.announcement_text && (
                    <AnnouncementBar
                        text={settings.announcement_text as string}
                        color={settings.announcement_color as string}
                        textColor={settings.announcement_text_color as string}
                        marquee={settings.announcement_marquee as boolean}
                    />
                )}

                <Providers settings={settings}>
                    <AuthHashHandler />
                    {children}
                </Providers>

                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(organizationSchema),
                    }}
                />

                <AnalyticsWrapper
                    gaId={settings?.google_analytics_id}
                    pixelId={settings?.meta_pixel_id}
                />

                <CookieConsent />
                <VisitorTracker />
            </body>
        </html>
    )
}



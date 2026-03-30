import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { Inter, Montserrat, Playfair_Display } from 'next/font/google';
import { getPlatformSettings } from '@/lib/actions/settings';
import { Providers } from '../providers';
import { AnnouncementBar } from '@/components/AnnouncementBar';

import { AuthHashHandler } from '@/app/components/AuthHashHandler';
import { createClient } from '@/lib/supabase/server';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    const messages = await getMessages();
    const settings = await getPlatformSettings();

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: settings?.site_name || 'Beyan Dil Akademi',
        description: settings?.site_description || 'Online dil öğrenme platformu',
        logo: settings?.logo_url || '',
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: settings?.contact_phone || '',
            contactType: 'customer service'
        }
    };

    return (
        <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
            <body className={`${inter.variable} ${montserrat.variable} ${playfair.variable} antialiased`}>
                <NextIntlClientProvider messages={messages}>
                    {settings?.announcement_bar_enabled && settings.announcement_text && (
                        <AnnouncementBar
                            text={settings.announcement_text}
                            color={settings.announcement_color}
                            textColor={settings.announcement_text_color || undefined}
                            marquee={settings.announcement_marquee}
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
                </NextIntlClientProvider>
            </body>
        </html>
    );
}



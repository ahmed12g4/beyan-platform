import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beyandilakademi.com'

export const metadata: Metadata = {
    title: 'Eğitmen Başvurusu | Beyan Dil Akademi',
    description: 'Beyan Dil Akademi bünyesinde Arapça eğitmeni olarak görev almak için başvurunuzu yapın. Uzman kadromuza katılın.',
    keywords: ['eğitmen başvurusu', 'Arapça öğretmeni', 'online eğitmen', 'Beyan Dil Akademi', 'dil eğitmeni iş'],
    alternates: {
        canonical: `${siteUrl}/egitmen-basvuru`,
    },
    openGraph: {
        title: 'Eğitmen Başvurusu | Beyan Dil Akademi',
        description: 'Beyan Dil Akademi bünyesinde Arapça eğitmeni olarak görev almak için başvurunuzu yapın.',
        url: `${siteUrl}/egitmen-basvuru`,
        siteName: 'Beyan Dil Akademi',
        locale: 'tr_TR',
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: 'Eğitmen Başvurusu | Beyan Dil Akademi',
        description: 'Arapça eğitmeni olarak ekibimize katılın.',
    },
}

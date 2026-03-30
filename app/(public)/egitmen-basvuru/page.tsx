import type { Metadata } from 'next'
import TeacherApplyClient from './TeacherApplyClient'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beyandilakademi.com'

export const metadata: Metadata = {
    title: 'Eğitmen Başvurusu',
    description: 'Beyan Dil Akademi bünyesinde Arapça eğitmeni olarak görev almak için başvurunuzu yapın. Uzman kadromuza katılın ve öğrencilere ilham verin.',
    keywords: ['eğitmen başvurusu', 'Arapça öğretmeni', 'online eğitmen iş', 'Beyan Dil Akademi', 'dil eğitmeni'],
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

export default function TeacherApplicationPage() {
    return <TeacherApplyClient />
}

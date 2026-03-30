import { getPlatformSettings } from '@/lib/actions/settings'
import RegisterForm from './components/RegisterForm'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beyandilakademi.com'

export const metadata: Metadata = {
  title: 'Kayıt Ol | Beyan Dil Akademi',
  description: 'Beyan Dil Akademi\'ne ücretsiz kayıt olun ve Arapça öğrenmeye hemen başlayın. Canlı dersler ve video eğitimler sizi bekliyor.',
  keywords: ['kayıt', 'üye ol', 'Arapça kursu kayıt', 'Beyan Dil Akademi üyelik'],
  alternates: {
    canonical: `${siteUrl}/kayit`,
  },
  openGraph: {
    title: 'Kayıt Ol | Beyan Dil Akademi',
    description: 'Beyan Dil Akademi\'ne ücretsiz kayıt olun ve Arapça öğrenmeye hemen başlayın.',
    url: `${siteUrl}/kayit`,
    siteName: 'Beyan Dil Akademi',
    locale: 'tr_TR',
    type: 'website',
  },
  // Prevent search engine indexing of auth pages
  robots: {
    index: false,
    follow: false,
  },
}


export default async function RegisterPage() {
  const settings = await getPlatformSettings()

  // Default to true if settings fetch fails or is not set
  const allowRegistrations = settings?.allow_new_registrations ?? true

  if (!allowRegistrations) {
    return (
      <main className="min-h-screen flex items-center justify-center py-12 px-4 bg-brand-primary-light">
        <div className="w-full max-w-[500px] bg-white rounded-lg border border-gray-200 shadow-xl p-8 text-center">
          <div className="w-20 h-20 relative mx-auto mb-6 opacity-80">
            <Image src="/assets/logo-new.png" alt="Logo" fill sizes="150px" className="object-contain grayscale" />
          </div>

          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-user-slash text-2xl text-gray-500"></i>
          </div>

          <h1 className="text-2xl font-bold text-brand-primary mb-3">
            Kayıtlar Kapalı
          </h1>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Şu anda yeni üye alımı geçici olarak durdurulmuştur.
            Daha sonra tekrar deneyebilir veya mevcut hesabınızla giriş yapabilirsiniz.
          </p>

          <div className="space-y-3">
            <Link
              href="/giris"
              className="block w-full py-3 bg-brand-primary text-white rounded-lg font-semibold hover:bg-[#1a3a39] transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/"
              className="block w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return <RegisterForm termsContent={(settings as any)?.student_terms} />
}

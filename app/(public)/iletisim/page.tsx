import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import type { Metadata } from 'next'
import { getPlatformSettings } from '@/lib/actions/settings'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beyandilakademi.com'

export const metadata: Metadata = {
    title: 'İletişim',
    description: 'Beyan Dil Akademi ile iletişime geçin. Sorularınız, Arapça kursları hakkında bilgi almak veya eğitmen başvurusu için bize ulaşın.',
    keywords: ['iletişim', 'Beyan Dil Akademi', 'Arapça kursu', 'online dil kursu', 'eğitim destek'],
    alternates: {
        canonical: `${siteUrl}/iletisim`,
    },
    openGraph: {
        title: 'İletişim | Beyan Dil Akademi',
        description: 'Beyan Dil Akademi ile iletişime geçin. Sorularınız için buradayız.',
        url: `${siteUrl}/iletisim`,
        siteName: 'Beyan Dil Akademi',
        locale: 'tr_TR',
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: 'İletişim | Beyan Dil Akademi',
        description: 'Beyan Dil Akademi ile iletişime geçin.',
    },
}

export default async function ContactPage() {
    const settings = await getPlatformSettings()

    // Contact info from settings (fall back to empty so we don't show fake data)
    const phone = settings?.contact_phone || null
    const email = settings?.contact_email || null
    const socialLinkedin = settings?.social_linkedin || null
    const socialInstagram = settings?.social_instagram || null
    const socialFacebook = settings?.social_facebook || null
    const socialWhatsapp = (settings as any)?.social_whatsapp || null

    return (
        <main className="min-h-screen bg-brand-primary pb-24 text-white">
            {/* Header Section */}
            <div className="text-center pt-[80px] pb-[60px] px-4 opacity-0 animate-slideUp">
                <span className="text-brand-accent text-sm font-bold tracking-[0.2em] uppercase mb-3 block">Bize Ulaşın</span>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight relative inline-block">
                    İletişim

                    <span className="absolute -right-4 bottom-2 w-2 h-2 bg-brand-accent rounded-full"></span>
                </h1>
                <div className="w-[80px] h-[4px] bg-brand-accent mx-auto rounded-full mb-8"></div>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
                    Sorularınız için bizimle iletişime geçin.
                </p>
            </div>

            {/* Content Container */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">

                {/* Top Section: 3 Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 opacity-0 animate-slideUp animate-delay-200">

                    {/* Card 1: Phone */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center hover:bg-white/10 transition-colors duration-300 backdrop-blur-sm group">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-white/5 flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform duration-300 group-hover:bg-brand-accent group-hover:text-brand-primary">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.61-.35-.13-.74-.07-1.01.18l-2.2 2.2c-2.75-1.49-5.01-3.75-6.5-6.5l2.2-2.2c.28-.28.36-.67.25-1.02A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Telefon</h3>
                        {phone ? (
                            <a href={`tel:${phone}`} className="text-gray-300 font-light dir-ltr tracking-wide hover:text-brand-accent transition-colors">
                                {phone}
                            </a>
                        ) : (
                            <p className="text-gray-500 font-light italic text-sm">Henüz güncellenmedi</p>
                        )}
                    </div>

                    {/* Card 2: Email */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center hover:bg-white/10 transition-colors duration-300 backdrop-blur-sm group">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-white/5 flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform duration-300 group-hover:bg-brand-accent group-hover:text-brand-primary">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">E-posta</h3>
                        {email ? (
                            <a href={`mailto:${email}`} className="text-gray-300 font-light tracking-wide hover:text-brand-accent transition-colors">
                                {email}
                            </a>
                        ) : (
                            <p className="text-gray-500 font-light italic text-sm">Henüz güncellenmedi</p>
                        )}
                    </div>

                    {/* Card 3: Social Media */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center hover:bg-white/10 transition-colors duration-300 backdrop-blur-sm group">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-white/5 flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform duration-300 group-hover:bg-brand-accent group-hover:text-brand-primary">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-white">Sosyal Medya</h3>

                        <div className="flex justify-center flex-wrap gap-4 mt-2">
                            {/* WhatsApp */}
                            <Link
                                href={socialWhatsapp || '#'}
                                target={socialWhatsapp ? "_blank" : "_self"}
                                rel="noopener noreferrer"
                                className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all duration-300 ${!socialWhatsapp ? 'opacity-20 pointer-events-none' : ''}`}
                            >
                                <i className="fab fa-whatsapp text-xl"></i>
                            </Link>

                            {/* LinkedIn */}
                            <Link
                                href={socialLinkedin || '#'}
                                target={socialLinkedin ? "_blank" : "_self"}
                                rel="noopener noreferrer"
                                className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all duration-300 ${!socialLinkedin ? 'opacity-20 pointer-events-none' : ''}`}
                            >
                                <i className="fab fa-linkedin-in text-xl"></i>
                            </Link>

                            {/* Instagram */}
                            <Link
                                href={socialInstagram || '#'}
                                target={socialInstagram ? "_blank" : "_self"}
                                rel="noopener noreferrer"
                                className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all duration-300 ${!socialInstagram ? 'opacity-20 pointer-events-none' : ''}`}
                            >
                                <i className="fab fa-instagram text-xl"></i>
                            </Link>

                            {/* Facebook */}
                            <Link
                                href={socialFacebook || '#'}
                                target={socialFacebook ? "_blank" : "_self"}
                                rel="noopener noreferrer"
                                className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all duration-300 ${!socialFacebook ? 'opacity-20 pointer-events-none' : ''}`}
                            >
                                <i className="fab fa-facebook-f text-xl"></i>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Contact Form */}
                <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-lg p-8 md:p-12 opacity-0 animate-slideUp animate-delay-300 relative overflow-hidden backdrop-blur-sm">
                    {/* Decorative Top Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FEDD59] to-transparent opacity-50"></div>

                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-brand-accent mb-4">
                            Bize Ulaşın
                        </h2>

                        <p className="text-gray-300 font-light text-base">
                            Aşağıdaki formu doldurarak bize doğrudan mesaj gönderebilirsiniz.
                        </p>
                    </div>

                    <ContactForm />
                </div>

            </div>
        </main>
    );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useSettings } from "@/app/contexts/SettingsContext";

export default function Footer() {
    const { settings } = useSettings();
    const siteName = settings?.site_name || "Beyan Dil Akademi";
    const footerDesc = settings?.footer_description || "Modern metotlarla Arapça eğitimi veren, öğrencilerine dilin inceliklerini sevdiren öncü bir akademi.";
    const logoUrl = settings?.logo_url || "/assets/logo-new.png";
    const phone = settings?.contact_phone || "+90 555 123 45 67";
    const email = settings?.contact_email || "info@beyandil.com";
    const qrCodeUrl = settings?.qr_code_url;

    // Social Links from settings
    const socialFacebook = settings?.social_facebook;
    const socialInstagram = settings?.social_instagram;
    const socialLinkedin = settings?.social_linkedin;
    const socialWhatsapp = (settings as any)?.social_whatsapp;

    const scrollToTop = () => {
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <footer className="bg-white border-t border-brand-primary/10 pt-8 pb-10 md:pt-10 md:pb-12 relative">

            {/* Scroll to Top Button (Centered perfectly between the dark/white backgrounds) */}
            <button
                onClick={scrollToTop}
                className="absolute right-6 md:right-12 -top-6 md:-top-7 w-12 h-12 md:w-14 md:h-14 bg-brand-accent text-brand-primary flex items-center justify-center rounded-lg md:rounded-lg hover:-translate-y-1 hover:scale-105 transition-all duration-300 shadow-[0_8px_25px_rgba(254,221,89,0.35)] z-20"
                aria-label="Yukarı Çık"
            >
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            </button>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-20 lg:gap-40 mb-8 pb-10 border-b border-gray-100/80 items-start">

                    {/* Col 1: Brand & Socials - Tightened & Centered */}
                    <div className="flex flex-col items-center text-center">
                        <Link href="/" className="flex flex-col items-center gap-4 mb-0 group">
                            <div className="relative w-[62px] h-[62px] transition-transform duration-500 group-hover:scale-105">
                                <Image
                                    src={logoUrl}
                                    alt="Logo"
                                    fill
                                    sizes="62px"
                                    className="object-contain"
                                />
                            </div>
                            <h3 className="font-serif font-bold tracking-tight text-brand-primary text-[22px] whitespace-nowrap">
                                {siteName}
                            </h3>
                        </Link>
                        <p className="text-[15px] text-gray-400 leading-relaxed mb-6 font-light max-w-[450px] -mt-1">
                            {footerDesc}
                        </p>

                        {/* Social Media Icons */}
                        <div className="flex gap-4 justify-center">
                            <a href={socialWhatsapp || '#'} target={socialWhatsapp ? "_blank" : "_self"} rel="noopener noreferrer" className={`w-10 h-10 rounded-lg border border-gray-100 bg-white flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 shadow-sm ${!socialWhatsapp ? 'opacity-40 pointer-events-none' : ''}`}>
                                <i className="fab fa-whatsapp text-[18px]"></i>
                            </a>
                            <a href={socialLinkedin || '#'} target={socialLinkedin ? "_blank" : "_self"} rel="noopener noreferrer" className={`w-10 h-10 rounded-lg border border-gray-100 bg-white flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 shadow-sm ${!socialLinkedin ? 'opacity-40 pointer-events-none' : ''}`}>
                                <i className="fab fa-linkedin-in text-[16px]"></i>
                            </a>
                            <a href={socialInstagram || '#'} target={socialInstagram ? "_blank" : "_self"} rel="noopener noreferrer" className={`w-10 h-10 rounded-lg border border-gray-100 bg-white flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 shadow-sm ${!socialInstagram ? 'opacity-40 pointer-events-none' : ''}`}>
                                <i className="fab fa-instagram text-[16px]"></i>
                            </a>
                            <a href={socialFacebook || '#'} target={socialFacebook ? "_blank" : "_self"} rel="noopener noreferrer" className={`w-10 h-10 rounded-lg border border-gray-100 bg-white flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 shadow-sm ${!socialFacebook ? 'opacity-40 pointer-events-none' : ''}`}>
                                <i className="fab fa-facebook-f text-[16px]"></i>
                            </a>
                        </div>
                    </div>

                    {/* Col 2: Kurumsal */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h4 className="font-bold mb-8 tracking-wide text-[16px] text-brand-primary uppercase">
                            Kurumsal
                        </h4>
                        <nav className="flex flex-col gap-4">
                            {[
                                { name: "Hakkımızda", href: "/hakkimizda" },
                                { name: "Başarı Hikayeleri", href: "/reviews" },
                                { name: "İletişim", href: "/iletisim" },
                                { name: "Eğitmen Başvurusu", href: "/egitmen-basvuru" }
                            ].map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-[15.5px] text-gray-500 font-medium transition-colors hover:text-brand-primary whitespace-nowrap"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Col 3: Eğitimler */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h4 className="font-bold mb-8 tracking-wide text-[16px] text-brand-primary uppercase">
                            Eğitimler
                        </h4>
                        <nav className="flex flex-col gap-4">
                            {[
                                { name: "Tüm Eğitimler", href: "/courses" },
                                { name: "Özel Dersler", href: "/private-lessons" },
                                { name: "Gruplar", href: "/groups" }
                            ].map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-[15.5px] text-gray-500 font-medium transition-colors hover:text-brand-primary whitespace-nowrap"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Col 4: Destek & Contact (Preserving all info) */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h4 className="font-bold mb-8 tracking-wide text-[16px] text-brand-primary uppercase">
                            Destek
                        </h4>
                        <nav className="flex flex-col gap-4 mb-6">
                            {[
                                { name: "Blog", href: "/blog" },
                                { name: "Sıkça Sorulan Sorular", href: "/sss" }
                            ].map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-[15.5px] text-gray-500 font-medium transition-colors hover:text-brand-primary whitespace-nowrap"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>

                        {/* Contact info - Polished & Cohesive */}
                        <div className="flex flex-col items-center md:items-start gap-4 mb-6">
                            <a href={`tel:${phone}`} className="flex items-center gap-3 text-[14.5px] text-gray-500 hover:text-brand-primary transition-colors whitespace-nowrap group">
                                <i className="fas fa-phone-alt text-[13px] text-brand-primary"></i>
                                <span className="font-medium tracking-wide">{phone}</span>
                            </a>
                            <a href={`mailto:${email}`} className="flex items-center gap-3 text-[14.5px] text-gray-500 hover:text-brand-primary transition-colors whitespace-nowrap group">
                                <i className="fas fa-envelope text-[13px] text-brand-primary"></i>
                                <span className="lowercase font-medium">{email}</span>
                            </a>
                        </div>

                        {/* QR Code kept to ensure nothing is deleted */}
                        <div className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm">
                            <div className="w-[65px] h-[65px] relative flex items-center justify-center">
                                {qrCodeUrl ? (
                                    <Image
                                        src={qrCodeUrl}
                                        alt="QR Code"
                                        fill
                                        sizes="65px"
                                        className="object-contain"
                                    />
                                ) : (
                                    <i className="fas fa-qrcode text-xl text-gray-200"></i>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright */}
                <div className="text-center">
                    <p className="text-[15px] text-gray-400 font-medium">
                        {settings?.footer_copyright || `© ${new Date().getFullYear()} ${siteName}. Tüm hakları saklıdır.`}
                    </p>
                </div>
            </div>
        </footer>
    );
}

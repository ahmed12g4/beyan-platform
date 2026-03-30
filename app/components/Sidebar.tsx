"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    const navLinks = [
        { name: "Ana Sayfa", path: "/" },
        { name: "Kayıtlı Kurslar", path: "/courses" },
        { name: "Grup Dersleri", path: "/groups" },
        { name: "Özel Dersler", path: "/private-lessons" },
        { name: "Blog", path: "/blog" },
        { name: "Yorumlar", path: "/reviews" },
        { name: "İletişim", path: "/iletisim" },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 z-[90] transition-opacity duration-400 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-brand-primary shadow-2xl z-[100] transform transition-transform duration-400 cubic-bezier(0.16, 1, 0.3, 1) overflow-y-auto ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Close Button */}
                <div className="flex justify-end p-4">
                    <button
                        onClick={onClose}
                        className="text-white hover:text-brand-accent transition-colors"
                        aria-label="Close menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Auth Buttons */}
                <div className="px-5 space-y-3 mb-6">
                    {/* Kayıt Ol Button */}
                    <Link
                        href="/kayit"
                        onClick={onClose}
                        className="block w-full bg-brand-accent text-brand-primary py-3 rounded-lg font-semibold hover:bg-[#ffe680] transition-colors text-center"
                    >
                        Kayıt Ol
                    </Link>

                    {/* Giriş Yap Button */}
                    <Link
                        href="/giris"
                        onClick={onClose}
                        className="block w-full bg-transparent text-white py-3 rounded-lg font-medium border border-white/30 hover:bg-white/5 transition-colors text-center"
                    >
                        Giriş Yap
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="px-3" suppressHydrationWarning>
                    {navLinks.map((link) => {
                        const isActive = pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                href={link.path}
                                onClick={onClose}
                                className={`block px-4 py-3 mb-1 rounded-lg text-[0.95rem] transition-colors ${isActive
                                    ? "bg-brand-primary-dark text-brand-accent font-medium"
                                    : "text-white/90 hover:bg-brand-primary-hover hover:text-white"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}

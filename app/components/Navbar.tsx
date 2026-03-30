"use client";

import Link from "next/link";
import Image from "next/image";
import { useSettings } from "@/app/contexts/SettingsContext";

interface NavbarProps {
    onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const { settings } = useSettings();
    const siteName = settings?.site_name || "Beyan Dil Akademi";
    const logoUrl = settings?.logo_url || "/assets/logo-new.png";

    const links = [
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
            <nav className="bg-brand-primary text-white h-[65px] flex items-center shadow-[0_2px_10px_rgba(0,0,0,0.1)] sticky top-0 z-50">
                <div className="max-w-[1200px] mx-auto px-3 w-full flex justify-between items-center h-full">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 ml-0">
                        <div className="relative w-12 h-12">
                            <Image
                                src={logoUrl}
                                alt="Logo"
                                fill
                                sizes="48px"
                                className="object-contain"
                            />
                        </div>
                        <span className="font-serif font-normal text-[1.4rem] md:text-[1.7rem] tracking-normal text-white whitespace-nowrap shrink-0">
                            {siteName}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden xl:flex items-center gap-[30px] h-full">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className="text-[0.95rem] font-medium opacity-95 hover:opacity-100 hover:text-brand-accent transition-all duration-300 flex items-center h-full whitespace-nowrap shrink-0"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Hamburger (Visual Only - No Logic) */}
                    <button onClick={onMenuClick} className="xl:hidden text-white cursor-pointer">
                        <svg className="w-[1.6rem] h-[1.6rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </div>
            </nav>
        </>
    );
}

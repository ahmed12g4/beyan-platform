'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAction } from '@/lib/actions/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import Avatar from '@/components/Avatar';
import NotificationDropdown from '@/components/NotificationDropdown';
import { THEME_CONFIG } from '@/lib/theme-config';
import { useSettings } from '@/app/contexts/SettingsContext';
import { useMessages } from '@/hooks/useMessages';

// Admin Navigation Items
const mainNavItems = [
    { id: 'genel-bakis', label: 'Genel Bakış', href: '/admin', icon: 'fa-home' },
    { id: 'takvim', label: 'Master Takvim', href: '/admin/calendar', icon: 'fa-calendar-alt' },
];

const managementItems = [
    { id: 'kullanicilar', label: 'Kullanıcılar', href: '/admin/users', icon: 'fa-users' },
    { id: 'kurslar', label: 'Kurslar', href: '/admin/courses', icon: 'fa-book' },
    { id: 'gruplar', label: 'Gruplar', href: '/admin/groups', icon: 'fa-layer-group' },
    { id: 'yorumlar', label: 'Yorumlar', href: '/admin/reviews', icon: 'fa-star' },
    { id: 'odemeler', label: 'Ödemeler', href: '/admin/payments', icon: 'fa-wallet' },
    { id: 'analizler', label: 'Analizler', href: '/admin/analytics', icon: 'fa-chart-pie' },
];

const systemNavItems = [
    { id: 'bildirimler', label: 'Bildirimler', href: '/admin/notifications', icon: 'fa-bell' },
    { id: 'ayarlar', label: 'Ayarlar', href: '/admin/settings', icon: 'fa-cog' },
];

export default function TopNavigation() {
    const pathname = usePathname();
    const router = useRouter();
    const user = useCurrentUser();
    const { unreadCount: messageUnreadCount, recentMessages, loading: messagesLoading } = useMessages();
    const { settings } = useSettings();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [messagesOpen, setMessagesOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [managementOpen, setManagementOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const managementRef = useRef<HTMLDivElement>(null);

    // Close all dropdowns helper
    const closeAllDropdowns = () => {
        setUserMenuOpen(false);
        setMessagesOpen(false);
        setNotificationsOpen(false);
        setManagementOpen(false);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                !target.closest('[data-account-dropdown]') &&
                !target.closest('[data-messages-dropdown]') &&
                !target.closest('[data-notifications-dropdown]') &&
                !target.closest('[data-management-dropdown]')
            ) {
                closeAllDropdowns();
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logoutAction()
        } catch {
            // Ignore redirect error
        }
    };

    return (
        <nav className="bg-brand-primary border-b border-brand-primary-dark sticky top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Logo */}
                    <Link href="/admin" className="flex items-center gap-3 flex-shrink-0">
                        <div className="relative w-12 h-12">
                            <Image
                                src={(mounted && settings?.logo_url) ? settings.logo_url : "/assets/logo-new.png"}
                                alt="Logo"
                                fill
                                sizes="48px"
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="font-serif font-normal text-[1.4rem] md:text-[1.7rem] tracking-normal text-white hidden sm:block">
                            {settings?.site_name || 'Beyan Dil Akademi'}
                        </span>
                    </Link>

                    {/* Center: Horizontal Navigation (Desktop) */}
                    <div className="hidden lg:flex items-center gap-1">
                        {mainNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`px-4 py-2 text-sm font-bold transition-all relative flex items-center gap-2 ${isActive
                                        ? 'text-white'
                                        : 'text-white/80 hover:text-brand-accent'
                                        }`}
                                >
                                    
                                    {item.label}
                                    {isActive && (
                                        <span className="absolute bottom-[-18px] left-0 right-0 h-1 bg-brand-accent rounded-t-full shadow-[0_-4px_10px_rgba(255,215,0,0.3)]"></span>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Management Dropdown */}
                        <div className="relative h-full flex items-center" data-management-dropdown>
                            <button
                                onClick={() => {
                                    const wasOpen = managementOpen;
                                    closeAllDropdowns();
                                    setManagementOpen(!wasOpen);
                                }}
                                className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${managementItems.some(i => pathname === i.href) || managementOpen
                                    ? 'text-white'
                                    : 'text-white/80 hover:text-brand-accent'
                                    }`}
                            >
                                Yönetim
                                <i className={`fas fa-chevron-down text-[10px] transition-transform duration-200 ${managementOpen ? 'rotate-180' : ''}`}></i>
                            </button>

                            {managementOpen && (
                                <div className="absolute top-[50px] left-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    {managementItems.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            onClick={() => setManagementOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${pathname === item.href ? 'bg-gray-50 text-brand-primary' : 'text-gray-600'}`}
                                        >
                                            <span className="text-xs font-bold">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {systemNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`px-4 py-2 text-sm font-bold transition-all relative flex items-center gap-2 ${isActive
                                        ? 'text-white'
                                        : 'text-white/80 hover:text-brand-accent'
                                        }`}
                                >
                                    
                                    {item.label}
                                    {isActive && (
                                        <span className="absolute bottom-[-18px] left-0 right-0 h-1 bg-brand-accent rounded-t-full shadow-[0_-4px_10px_rgba(255,215,0,0.3)]"></span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right: Messages + Notification + Avatar */}
                    <div className="flex items-center gap-3">

                        {/* Messages Icon */}
                        <div className="relative" data-messages-dropdown>
                            <button
                                onClick={() => {
                                    const wasOpen = messagesOpen;
                                    closeAllDropdowns();
                                    setMessagesOpen(!wasOpen);
                                }}
                                className="p-2 hover:bg-brand-primary-dark rounded-lg transition-colors relative block"
                                aria-label="Mesajlar"
                                title="Mesajlar"
                            >
                                <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                {messageUnreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 bg-brand-accent text-brand-primary text-[10px] font-bold flex items-center justify-center rounded-full border-[2px] border-brand-primary z-10 transition-all">
                                        {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Messages Dropdown */}
                            {messagesOpen && (
                                <div
                                    className="fixed left-4 right-4 top-[72px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 w-auto sm:w-[380px] bg-white rounded-lg border border-gray-100 py-0 z-[100] flex flex-col max-h-[80vh] sm:max-h-[480px] overflow-hidden shadow-xl ring-1 ring-black/5 origin-top sm:origin-top-right transition-all duration-200 animate-in fade-in zoom-in-95 font-sans"
                                >
                                    <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0 relative z-10">
                                        <h3 className="font-bold text-gray-900 text-[17px] tracking-tight">Mesajlar</h3>
                                        {messageUnreadCount > 0 && (
                                            <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide">{messageUnreadCount} YENİ</span>
                                        )}
                                    </div>
                                    <div className="overflow-y-auto custom-scrollbar bg-white flex-1 relative">
                                        {messagesLoading ? (
                                            <div className="p-8 text-center flex flex-col items-center gap-3">
                                                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                            </div>
                                        ) : recentMessages && recentMessages.length === 0 ? (
                                            <div className="p-8 text-center flex flex-col items-center gap-2 text-gray-400">
                                                <i className="far fa-envelope-open text-2xl text-gray-300 mb-1"></i>
                                                <span className="text-sm">Mesaj yok</span>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {recentMessages?.map((msg) => (
                                                    <Link
                                                        key={msg.id}
                                                        href="/admin/messages"
                                                        onClick={() => setMessagesOpen(false)}
                                                        className={`flex gap-3 p-3 hover:bg-gray-50 transition-colors ${!msg.is_read ? 'bg-blue-50/30' : ''}`}
                                                    >
                                                        <Avatar
                                                            src={msg.profiles?.avatar_url}
                                                            name={msg.profiles?.full_name || 'Kullanıcı'}
                                                            size={40}
                                                        />
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <div className="flex justify-between items-center mb-0.5">
                                                                <span className={`font-bold text-[15px] truncate pr-2 leading-none ${!msg.is_read ? 'text-brand-primary' : 'text-gray-900'}`}>
                                                                    {msg.profiles?.full_name || 'İsimsiz Kullanıcı'}
                                                                </span>
                                                                <span className="text-[11px] text-gray-400 flex-shrink-0 leading-none">
                                                                    {new Date(msg.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            </div>
                                                            <p className={`text-[14px] truncate leading-tight mt-1.5 ${!msg.is_read ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                                                {msg.content}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] flex-shrink-0 z-10 w-full text-center group">
                                        <Link
                                            href="/admin/messages"
                                            className="block w-full py-2.5 rounded-lg text-[13px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                            onClick={() => setMessagesOpen(false)}
                                        >
                                            Tüm Mesajları Gör
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>



                        {/* Notifications Dropdown */}
                        <NotificationDropdown
                            isOpen={notificationsOpen}
                            onClose={() => setNotificationsOpen(false)}
                            onToggle={() => {
                                const wasOpen = notificationsOpen;
                                closeAllDropdowns();
                                setNotificationsOpen(!wasOpen);
                            }}
                        />

                        {/* User Avatar with Dropdown */}
                        <div className="relative" data-account-dropdown>
                            <button
                                onClick={() => {
                                    const wasOpen = userMenuOpen;
                                    closeAllDropdowns();
                                    setUserMenuOpen(!wasOpen);
                                }}
                                className="w-10 h-10 flex-shrink-0"
                            >
                                <Avatar
                                    src={user.profile?.avatar_url}
                                    name={user.profile?.full_name || user.user?.email || 'Yönetici'}
                                    size={40}
                                    className="w-full h-full"
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-md border-2 border-gray-100 py-2 z-50">

                                    <Link
                                        href="/admin/settings"
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-sm font-medium text-gray-900">Ayarlar</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full text-left"
                                    >
                                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span className="text-sm font-medium text-red-600">Çıkış Yap</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 text-white hover:bg-brand-primary-dark rounded-lg"
                            aria-label="Menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-t border-brand-primary-dark bg-brand-primary">
                    <div className="px-4 py-3 space-y-1">
                        {[...mainNavItems, ...managementItems, ...systemNavItems].map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                                        ? 'text-brand-primary bg-brand-accent'
                                        : 'text-white hover:text-brand-accent hover:bg-brand-primary-dark'
                                        }`}
                                >
                                    <i className={`fas ${item.icon} w-5`}></i>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
}

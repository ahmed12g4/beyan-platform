'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/utils/formatDate';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    onToggle: () => void;
}

export default function NotificationDropdown({ isOpen, onClose, onToggle }: NotificationDropdownProps) {
    const { notifications, unreadCount, loading, markAsRead, markAllRead } = useNotifications();
    const [basePath, setBasePath] = useState('/student');

    useEffect(() => {
        const path = window.location.pathname;
        if (path.startsWith('/admin')) setBasePath('/admin');
        else if (path.startsWith('/teacher')) setBasePath('/teacher');
        else setBasePath('/student');
    }, []);

    // Filter to only show recent/unread in dropdown (e.g., top 5-6)
    const displayList = notifications.slice(0, 6);

    // Auto-close when clicking outside is already handled by parent TopNavigation,
    // but we can add isolated handling if used elsewhere.

    const handleNotificationClick = async (id: string, link: string | null) => {
        await markAsRead(id);
        onClose();
        if (link) {
            window.location.href = link;
        }
    };

    return (
        <div className="relative" data-notifications-dropdown>
            <button
                onClick={onToggle}
                className="p-2 hover:bg-brand-primary-dark/10 lg:hover:bg-brand-primary-dark rounded-lg transition-colors relative block cursor-pointer"
                aria-label="Bildirimler"
                title="Bildirimler"
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 bg-brand-accent text-brand-primary text-[10px] font-bold flex items-center justify-center rounded-full border-[2px] border-brand-primary z-10 transition-all">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="fixed left-4 right-4 top-[72px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 w-auto sm:w-[360px] md:w-[400px] bg-white rounded-lg border border-gray-100 py-0 z-[100] flex flex-col max-h-[80vh] sm:max-h-[500px] overflow-hidden shadow-xl ring-1 ring-black/5 origin-top sm:origin-top-right transition-all duration-200 animate-in fade-in zoom-in-95 font-sans"
                >
                    <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0 relative z-10">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-[17px] tracking-tight">Bildirimler</h3>
                            {unreadCount > 0 && (
                                <span className="bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide">{unreadCount} YENİ</span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllRead()}
                                className="text-[12px] font-bold text-gray-500 hover:text-brand-primary transition-colors"
                            >
                                Tümünü Okundu İşaretle
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto custom-scrollbar bg-white flex-1 relative">
                        {loading ? (
                            <div className="p-8 text-center flex flex-col items-center gap-3">
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                            </div>
                        ) : displayList.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center gap-3 text-gray-400">
                                <i className="far fa-bell-slash text-2xl text-gray-300"></i>
                                <span className="text-[14px] font-medium text-gray-500">Hiç bildiriminiz yok</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {displayList.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`flex p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-brand-primary/5' : ''}`}
                                        onClick={() => handleNotificationClick(notification.id, notification.link)}
                                    >
                                        <div className="flex-1 min-w-0 pr-2 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`text-[14px] leading-tight ${!notification.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                    {notification.title}
                                                </h4>
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 mt-1 rounded-full bg-brand-primary flex-shrink-0 ml-2"></div>
                                                )}
                                            </div>
                                            <p className={`text-[13px] leading-snug line-clamp-2 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                                                {notification.message}
                                            </p>
                                            <span className="text-[11px] font-medium text-gray-400 block pt-1">
                                                {formatRelativeTime(notification.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Link to full notifications page (to be created) */}
                    <div className="p-3 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] flex-shrink-0 z-10 w-full text-center group">
                        <Link
                            href={`${basePath}/notifications`}
                            className="block w-full py-2.5 rounded-lg text-[13px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-brand-primary transition-colors"
                            onClick={onClose}
                        >
                            Tüm Bildirimleri Gör
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

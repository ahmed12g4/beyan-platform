'use client';

import PageHeader from '@/components/admin/PageHeader';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import Link from 'next/link';
import { useEffect } from 'react';

export default function StudentNotificationsPage() {
    const { notifications, loading, markAsRead, markAllRead } = useNotifications();

    // Optionally mark all as read automatically when visiting this page? 
    // Usually best to let the user see what's new first.

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn flex justify-center items-center min-h-[50vh]">
                <div className="text-center flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-brand-primary/30 border-t-[#204544] rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Bildirimler yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
            <PageHeader
                title="Tüm Bildirimler"
                subtitle="Hesabınızla ilgili tüm duyurular ve sistem bildirimleri"
                icon="fa-bell"
                action={
                    notifications.some(n => !n.is_read) && (
                        <button
                            onClick={() => markAllRead()}
                            className="bg-white border border-gray-200 text-gray-700 hover:text-brand-primary hover:bg-gray-50 font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                        >
                            Tümünü Okundu İşaretle
                        </button>
                    )
                }
            />

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4 mt-8">
                {notifications.length === 0 ? (
                    <div className="text-center py-16">
                        <i className="far fa-bell-slash text-5xl text-gray-300 mb-4 block"></i>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Bildiriminiz Yok</h3>
                        <p className="text-gray-500">Şu anda gösterilecek herhangi bir bildirim bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-brand-primary/5' : ''}`}
                            >
                                <div className="mr-4 mt-1 hidden sm:block">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${!notification.is_read ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <i className={`fas ${notification.type === 'SYSTEM' ? 'fa-bullhorn' : 'fa-bell'}`}></i>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-base leading-tight pr-4 ${!notification.is_read ? 'font-bold text-brand-primary' : 'font-semibold text-gray-800'}`}>
                                            {notification.title}
                                            {!notification.is_read && (
                                                <span className="inline-block ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] uppercase font-black rounded">Yeni</span>
                                            )}
                                        </h4>
                                        <span className="text-[12px] font-medium text-gray-400 whitespace-nowrap mt-0.5">
                                            {formatRelativeTime(notification.created_at)}
                                        </span>
                                    </div>
                                    <p className={`text-[14px] leading-relaxed mb-3 ${!notification.is_read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                        {notification.message}
                                    </p>

                                    <div className="flex items-center gap-3">
                                        {notification.link && (
                                            <Link
                                                href={notification.link}
                                                onClick={() => markAsRead(notification.id)}
                                                className="inline-flex items-center text-sm font-bold text-brand-primary hover:text-[#1a3736] hover:underline"
                                            >
                                                Detayları Gör <i className="fas fa-chevron-right ml-1 text-[10px]"></i>
                                            </Link>
                                        )}

                                        {!notification.is_read && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
                                            >
                                                Okundu İşaretle
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

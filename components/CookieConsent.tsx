'use client';

import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'beyan_cookie_consent';

export const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!hasConsented) {
            // Add a small delay so it doesn't appear immediately on page load
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'all');
        setIsVisible(false);
        // If they accept all, reload to activate tracking scripts if present
        window.location.reload();
    };

    const handleNecessaryOnly = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'necessary');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 animate-slideUp">
            <div className="max-w-5xl mx-auto bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-lg p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between transform transition-all">
                <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-cookie-bite text-brand-primary"></i> Çerez Politikası (Cookies)
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        Platformumuzun tam kapasiteyle ve sorunsuz çalışabilmesi için çerezleri (cookies) kullanıyoruz.
                        Size özel içerikler sunmamız ve hizmet kalitemizi artırmamız için lütfen "Tümünü Kabul Et" seçeneği ile onay verin.
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto shrink-0 justify-end md:justify-start mt-4 md:mt-0">
                    <button
                        onClick={handleNecessaryOnly}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                        title="Banner'ı kapat (Sadece gerekli çerezler)"
                    >
                        Kapat
                    </button>
                    <button
                        onClick={handleAcceptAll}
                        className="w-full sm:w-auto px-8 py-3 text-[15px] font-extrabold text-white bg-brand-primary hover:bg-brand-primary-dark rounded-lg transition-all shadow-lg shadow-[#204544]/30 whitespace-nowrap hover:scale-105"
                    >
                        Tümünü Kabul Et
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slideUp {
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

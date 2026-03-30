'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .catch(() => {
                    // SW registration failed silently — app still works normally
                });
        }

        // Capture install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show banner after a short delay so it doesn't feel intrusive
            setTimeout(() => setShowBanner(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler as EventListener);
        return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            toast.success('Uygulama cihazınıza yüklendi! 🎉');
        }
        setDeferredPrompt(null);
        setShowBanner(false);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        // Don't show again for this session
        setDeferredPrompt(null);
    };

    if (!showBanner || !deferredPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[360px] z-[200] animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-brand-primary text-white rounded-lg shadow-2xl shadow-[#204544]/30 p-5 border border-white/10">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-accent rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white leading-tight">Uygulamayı Yükle</p>
                        <p className="text-white/70 text-xs mt-1 leading-relaxed">
                            Beyan&apos;ı ana ekranınıza ekleyin ve internet bağlantısı olmadan bile öğrenmeye devam edin.
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-white/50 hover:text-white transition-colors flex-shrink-0 -mt-1"
                        aria-label="Kapat"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={handleInstall}
                        className="flex-1 bg-brand-accent text-brand-primary font-black text-sm py-2.5 rounded-lg hover:bg-[#fce94a] transition-colors active:scale-95"
                    >
                        Yükle
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="flex-1 bg-white/10 text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        Şimdi Değil
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLiveSessionBannerAction } from '@/lib/actions/sessions';

export default function LiveSessionBanner() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const data = await getLiveSessionBannerAction();
                setSession(data);
            } catch (err) {
                console.error("Failed to fetch live session banner:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
        // Refresh every 5 minutes to check for new live sessions
        const interval = setInterval(fetchSession, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !session || !isVisible) return null;

    const isLive = session.status === 'LIVE';
    const startTime = new Date(session.session_date);
    const timeDisplay = isLive ? 'CANLI YAYIN' : `BAŞLIYOR: ${startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

    return (
        <div className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white py-3 px-4 relative overflow-hidden group border-b border-white/10">
            {/* Animated background pulse if live */}
            {isLive && (
                <div className="absolute inset-0 bg-brand-accent/5 animate-pulse pointer-events-none"></div>
            )}
            
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider ${isLive ? 'bg-red-500 animate-bounce' : 'bg-brand-accent text-brand-primary'}`}>
                        {timeDisplay}
                    </div>
                    <div className="text-center md:text-left pr-8">
                        <h3 className="font-bold text-[14px] md:text-[15px] leading-tight">
                            {session.title}
                        </h3>
                        <p className="text-[12px] text-white/80 mt-0.5">
                            {session.course?.title || 'Genel Katılıma Açık Oturum'} • {session.teacher?.full_name}
                        </p>
                    </div>
                </div>

                <Link
                    href={session.meet_url}
                    target="_blank"
                    className="bg-brand-accent text-brand-primary font-extrabold text-[13px] px-5 py-2 rounded-lg shadow-lg hover:bg-[#ffe680] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    {isLive ? 'ŞİMDİ KATIL' : 'DERSE GİT'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
            </div>
            
            {/* Close button */}
            <button 
                onClick={() => setIsVisible(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors"
                aria-label="Kapat"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

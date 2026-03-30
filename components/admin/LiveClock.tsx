'use client';

import { useState, useEffect } from 'react';

export default function LiveClock() {
    const [time, setTime] = useState<string>('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!isMounted) return <div className="w-16 h-4"></div>;

    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg border border-white/10 shadow-inner">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-brand-accent tabular-nums tracking-widest">
                {time}
            </span>
        </div>
    );
}

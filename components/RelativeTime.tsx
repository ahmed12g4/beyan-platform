'use client';

import { useState, useEffect } from 'react';

interface RelativeTimeProps {
    date: string | Date;
    className?: string;
}

export default function RelativeTime({ date, className }: RelativeTimeProps) {
    const [relativeTime, setRelativeTime] = useState<string>('');

    useEffect(() => {
        const calculateRelativeTime = () => {
            const now = new Date();
            const past = new Date(date);
            const diffMs = now.getTime() - past.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMinutes < 1) return 'şimdi';
            if (diffMinutes < 60) return `${diffMinutes}dk`;
            if (diffHours < 24) return `${diffHours}sa`;
            return `${diffDays}g`;
        };

        setRelativeTime(calculateRelativeTime());

        const interval = setInterval(() => {
            setRelativeTime(calculateRelativeTime());
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [date]);

    return (
        <span className={className} title={new Date(date).toLocaleString('tr-TR')}>
            {relativeTime}
        </span>
    );
}

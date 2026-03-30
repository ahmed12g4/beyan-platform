'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { getUpcomingSessionsAction } from '@/lib/actions/sessions';

export function useSessionReminders() {
    const remindedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        const checkSessions = async () => {
            try {
                const sessions = await getUpcomingSessionsAction();
                const now = new Date();

                sessions.forEach((session: any) => {
                    const sessionDate = new Date(session.session_date);
                    const diffMinutes = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60));

                    // 15-minute reminder
                    if (diffMinutes <= 15 && diffMinutes > 10 && !remindedIds.current.has(`${session.id}-15`)) {
                        toast.success(`Ders Başlıyor: "${session.title}" 15 dakika içinde başlayacak!`, {
                            duration: 6000,
                            icon: '⏰',
                        });
                        remindedIds.current.add(`${session.id}-15`);
                    }

                    // 5-minute reminder
                    if (diffMinutes <= 5 && diffMinutes > 0 && !remindedIds.current.has(`${session.id}-5`)) {
                        toast.error(`Ders Başlıyor: "${session.title}" 5 dakika içinde başlayacak! Hemen katılın.`, {
                            duration: 8000,
                            icon: '🚨',
                        });
                        remindedIds.current.add(`${session.id}-5`);
                    }
                });
            } catch (err) {
                console.error("Session reminder check failed:", err);
            }
        };

        checkSessions();
        // Check every 2 minutes
        const interval = setInterval(checkSessions, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);
}

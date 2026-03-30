'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notifications';
import { Database } from '@/types/database';
import { toast } from 'react-hot-toast';

type Notification = Database['public']['Tables']['notifications']['Row'];

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async (silent = false) => {
        // Safety timeout to prevent infinite loading if server action hangs
        let timeoutId: any;
        if (!silent && notifications.length === 0) {
            setLoading(true);
            timeoutId = setTimeout(() => setLoading(false), 8000);
        }

        try {
            const [notifsRes, countRes] = await Promise.all([
                getUserNotifications(),
                getUnreadNotificationCount()
            ]);

            if (notifsRes.success && notifsRes.data) {
                setNotifications(notifsRes.data);
            }
            if (countRes.success) {
                setUnreadCount(countRes.count ?? 0);
            }
        } catch (error) {
            console.error('Fetch notifications error:', error);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const initialFetch = async () => {
            if (isMounted) await fetchNotifications();
        };
        initialFetch();

        // Real-time synchronization using Supabase Realtime
        const setupRealtime = async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user || !isMounted) return;

            const channel = supabase
                .channel(`notifs_${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen to INSERT, UPDATE, DELETE
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            const newNotif = payload.new as Notification;
                            setNotifications(prev => {
                                // Avoid duplicates just in case
                                if (prev.some(n => n.id === newNotif.id)) return prev;
                                return [newNotif, ...prev];
                            });
                            if (!newNotif.is_read) {
                                setUnreadCount(c => c + 1);
                                // Show toast for new notification
                                toast.success(`${newNotif.title}: ${newNotif.message}`, {
                                    duration: 5000,
                                    position: 'top-right',
                                });
                            }
                        } else if (payload.eventType === 'DELETE') {
                            setNotifications(prev => {
                                const exists = prev.find(n => n.id === payload.old.id);
                                if (exists && !exists.is_read) {
                                    setUnreadCount(c => Math.max(0, c - 1));
                                }
                                return prev.filter(n => n.id !== payload.old.id);
                            });
                        } else if (payload.eventType === 'UPDATE') {
                            const updatedNotif = payload.new as Notification;
                            setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
                        }
                    }
                )
                .subscribe();

            return channel;
        };

        const channelPromise = setupRealtime();

        return () => {
            isMounted = false;
            channelPromise.then(channel => {
                if (channel) {
                    const { createClient } = require('@/lib/supabase/client');
                    const supabase = createClient();
                    supabase.removeChannel(channel);
                }
            });
        };
    }, [fetchNotifications]);

    useEffect(() => {
        const handleSync = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { action, id } = customEvent.detail;

            if (action === 'markAsRead' && id) {
                setNotifications(prev => {
                    const exists = prev.find(n => n.id === id);
                    if (exists && !exists.is_read) {
                        setUnreadCount(c => Math.max(0, c - 1));
                    }
                    return prev.map(n => n.id === id ? { ...n, is_read: true } : n);
                });
            } else if (action === 'markAllRead') {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        };

        window.addEventListener('notifications-sync', handleSync);
        return () => window.removeEventListener('notifications-sync', handleSync);
    }, []);

    const markAsRead = async (id: string, noBroadcast?: boolean) => {
        const res = await markNotificationAsRead(id);
        if (res.success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (!noBroadcast) {
                window.dispatchEvent(new CustomEvent('notifications-sync', { detail: { action: 'markAsRead', id } }));
            }
        }
    };

    const markAllRead = async (noBroadcast?: boolean) => {
        const res = await markAllNotificationsAsRead();
        if (res.success) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            if (!noBroadcast) {
                window.dispatchEvent(new CustomEvent('notifications-sync', { detail: { action: 'markAllRead' } }));
            }
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllRead,
        refresh: fetchNotifications
    };
}

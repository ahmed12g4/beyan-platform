'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUnreadMessageCountAction, getRecentMessagesAction } from '@/lib/actions/messaging';

export function useMessages() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Initialize supabase only once
    const [supabase] = useState(() => createClient());

    const fetchData = useCallback(async () => {
        try {
            // No need to set loading to true every time, just for initial
            const count = await getUnreadMessageCountAction();
            const messages = await getRecentMessagesAction(5);
            setUnreadCount(count);
            setRecentMessages(messages);
        } catch (error: any) {
            // Ignore abort errors
            if (error?.name === 'AbortError' || error?.message?.includes('abort')) {
                return;
            }
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Listen for internal refresh requests (e.g. from UserMessagesPage)
        const handleRefresh = () => fetchData();
        window.addEventListener('beyan-refresh-unread-count', handleRefresh);

        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel(`unread_count_${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT', // Only listen to new messages
                        schema: 'public',
                        table: 'messages',
                        filter: `receiver_id=eq.${user.id}`
                    },
                    () => {
                        fetchData();
                    }
                )
                .subscribe();

            return channel;
        };

        const channelPromise = setupSubscription();

        return () => {
            window.removeEventListener('beyan-refresh-unread-count', handleRefresh);
            channelPromise.then(channel => {
                if (channel) supabase.removeChannel(channel);
            });
        };
    }, [fetchData, supabase]);

    return { unreadCount, recentMessages, loading, refreshCount: fetchData };
}

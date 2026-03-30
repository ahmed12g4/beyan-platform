'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function sendMessageAction(receiverId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Oturum açmanız gerekiyor' };
    }

    try {
        const { error } = await (supabase.from('messages') as any).insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content,
        });

        if (error) throw error;

        revalidatePath('/admin/messages');
        revalidatePath('/student/messages');
        revalidatePath('/teacher/messages');

        return { success: true };
    } catch (error: any) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
    }
}

export async function getConversationsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // This is complex in Supabase without a dedicated view.
    // For MVP, we might handle this client-side or assume a list of known users.
    // Ideally, use a PostgreSQL function.
    return [];
}

export async function getUnreadMessageCountAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
        .from('messages')
        .select('id, profiles!messages_sender_id_fkey!inner(id)', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .neq('sender_id', user.id)
        .eq('is_read', false);

    if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }

    return count || 0;
}

export async function getRecentMessagesAction(limit = 5) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('messages')
        .select(`
            id,
            content,
            created_at,
            is_read,
            sender_id,
            profiles!messages_sender_id_fkey(full_name, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40); // Fetch more to allow for deduplication

    if (error) {
        console.error('Error fetching recent messages:', error);
        return [];
    }

    // Deduplicate by sender_id to show only 1 latest message per sender
    const seenSenders = new Set();
    const uniqueMessages: any[] = [];

    for (const msg of (data || [])) {
        if (!seenSenders.has((msg as any).sender_id)) {
            seenSenders.add((msg as any).sender_id);
            uniqueMessages.push(msg);
            if (uniqueMessages.length >= limit) break;
        }
    }

    return uniqueMessages;
}

export async function markAsReadAction(senderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await (supabase
        .from('messages') as any)
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', senderId)
        .eq('is_read', false);

    revalidatePath('/', 'layout'); // Refresh layout badges
}

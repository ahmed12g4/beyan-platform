'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Database } from '@/types/database';
import { randomUUID } from 'crypto';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export async function getUserNotifications() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, data: [] };

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching notifications:', error);
            return { success: false, data: [] };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error in getUserNotifications:', error);
        return { success: false, data: [] };
    }
}

export async function getUnreadNotificationCount() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: true, count: 0 };

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) {
            console.error('Error fetching unread count:', error);
            return { success: false, count: 0 };
        }

        return { success: true, count: count || 0 };
    } catch (error) {
        console.error('Error in getUnreadNotificationCount:', error);
        return { success: false, count: 0 };
    }
}

export async function markNotificationAsRead(notificationId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Oturum bulunamadı' };

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: 'Hata oluştu' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error in markNotificationAsRead:', error);
        return { success: false, error: 'Beklenmeyen hata' };
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Oturum bulunamadı' };

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return { success: false, error: 'Hata oluştu' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error in markAllNotificationsAsRead:', error);
        return { success: false, error: 'Beklenmeyen hata' };
    }
}

export async function createBroadcastNotification(input: {
    title: string;
    message: string;
    targetRole: 'all' | 'student' | 'teacher' | 'specific';
    targetUserId?: string;
    link?: string;
    type?: Notification['type'];
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Oturum bulunamadı' };

        // Check if admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return { success: false, error: 'Yetkiniz yok' };
        }

        const { createAdminClient } = await import('@/lib/supabase/server');
        const adminSupabase = await createAdminClient();

        const batchId = randomUUID();

        if (input.targetRole === 'specific' && input.targetUserId) {
            // For a single user, use standard insert
            const { error: insertError } = await adminSupabase
                .from('notifications')
                .insert({
                    user_id: input.targetUserId,
                    sender_id: user.id,
                    title: input.title,
                    message: input.message,
                    link: input.link || null,
                    type: input.type || 'SYSTEM',
                    is_read: false,
                    batch_id: batchId
                });

            if (insertError) {
                console.error('Error inserting notification:', insertError);
                return { success: false, error: 'Bildirim gönderilirken hata oluştu: ' + insertError.message };
            }
        } else {
            // For all, students, or teachers, use RPC to offload work to Postgres completely
            // @ts-ignore - Supabase types will be regenerated to include this RPC
            const { error: rpcError } = await adminSupabase.rpc('send_broadcast', {
                p_title: input.title,
                p_message: input.message,
                p_target_role: input.targetRole,
                p_sender_id: user.id,
                p_link: input.link || null,
                p_type: input.type || 'SYSTEM',
                p_batch_id: batchId
            });

            if (rpcError) {
                console.error('Error invoking send_broadcast RPC:', rpcError);

                // Fallback to old behavior if RPC is not deployed yet
                let query = adminSupabase.from('profiles').select('id');
                if (input.targetRole === 'student') query = query.eq('role', 'student');
                else if (input.targetRole === 'teacher') query = query.eq('role', 'teacher');

                const { data: users } = await query;
                if (!users || users.length === 0) return { success: false, error: 'Hedef kullanıcı bulunamadı' };

                const notificationsToInsert = users.map(u => ({
                    user_id: u.id,
                    sender_id: user.id,
                    title: input.title,
                    message: input.message,
                    link: input.link || null,
                    type: input.type || 'SYSTEM',
                    is_read: false,
                    batch_id: batchId
                }));

                // Chunk the inserts into 1000 items each to prevent payload limits
                const chunkSize = 1000;
                for (let i = 0; i < notificationsToInsert.length; i += chunkSize) {
                    const chunk = notificationsToInsert.slice(i, i + chunkSize);
                    await adminSupabase.from('notifications').insert(chunk as any);
                }
            }
        }

        revalidatePath('/admin/notifications');
        return { success: true, message: `Bildirim gönderildi.` };
    } catch (error) {
        console.error('Error in createBroadcastNotification:', error);
        return { success: false, error: 'Beklenmeyen hata' };
    }
}

export async function getAdminBroadcasts() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, data: [] };

        // Check if admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return { success: false, error: 'Yetkiniz yok' };
        }

        const { createAdminClient } = await import('@/lib/supabase/server');
        const adminSupabase = await createAdminClient();

        // Try using the optimized RPC first
        // @ts-ignore - Supabase types will be regenerated to include this RPC
        const { data: rpcData, error: rpcError } = await adminSupabase.rpc('get_admin_broadcasts', {
            p_admin_id: user.id
        });

        if (!rpcError && rpcData) {
            return {
                success: true,
                data: (rpcData as unknown as any[]).map((b: any) => ({
                    batch_id: b.batch_id,
                    title: b.title,
                    message: b.message,
                    type: b.type,
                    created_at: b.created_at,
                    recipientCount: Number(b.recipient_count)
                }))
            };
        }

        // Fallback if RPC is not deployed yet
        const { data, error } = await supabase
            .from('notifications')
            .select('id, batch_id, title, message, created_at, type')
            .eq('sender_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5000); // Prevent catastrophic memory crash

        if (error || !data) {
            console.error('Error fetching broadcasts:', error);
            return { success: false, data: [] };
        }

        // Group by batch_id locally
        const groupedMap = new Map<string, any>();
        data.forEach(notif => {
            const bId = notif.batch_id || notif.id; // fallback if no batch_id
            if (!groupedMap.has(bId)) {
                groupedMap.set(bId, {
                    batch_id: bId,
                    title: notif.title,
                    message: notif.message,
                    type: notif.type,
                    created_at: notif.created_at,
                    recipientCount: 1
                });
            } else {
                const existing = groupedMap.get(bId);
                existing.recipientCount += 1;
            }
        });

        const groupedData = Array.from(groupedMap.values()).sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return { success: true, data: groupedData };
    } catch (error) {
        console.error('Error in getAdminBroadcasts:', error);
        return { success: false, data: [] };
    }
}

export async function deleteBroadcast(batchId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Oturum bulunamadı' };

        // Check if admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return { success: false, error: 'Yetkiniz yok' };
        }

        // IMPORTANT: Use Admin Client to bypass RLS for global deletion
        // Regular server client is restricted by RLS (can only delete own notifications)
        const { createAdminClient } = await import('@/lib/supabase/server');
        const adminSupabase = await createAdminClient();

        // We delete by batch_id OR fallback by id
        const { error } = await adminSupabase
            .from('notifications')
            .delete()
            .or(`batch_id.eq.${batchId},id.eq.${batchId}`);

        if (error) {
            console.error('Error deleting broadcast:', error);
            return { success: false, error: 'Silinirken hata oluştu: ' + error.message };
        }

        revalidatePath('/admin/notifications');
        return { success: true, message: 'Bildirim başarıyla silindi.' };
    } catch (error) {
        console.error('Error in deleteBroadcast:', error);
        return { success: false, error: 'Beklenmeyen hata' };
    }
}

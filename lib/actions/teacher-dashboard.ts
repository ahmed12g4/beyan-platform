'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const teacherTips = [
    { title: "Geri Bildirim Gücü", content: "Öğrencilerinize düzenli ve yapıcı geri bildirimler vermek, onların motivasyonunu %40 oranında artırabilir." },
    { title: "İnteraktif Sınavlar", content: "Ders aralarında kısa, eğlenceli sınavlar düzenlemek bilgilerin akılda kalıcılığını sağlar." },
    { title: "Zaman Yönetimi", content: "Dersin ilk 5 dakikasını önceki dersin özeti, son 5 dakikasını ise gelecek dersin fragmanı olarak kullanın." },
    { title: "Görsel Materyaller", content: "Karmaşık konuları anlatırken infografikler veya kısa videolar kullanmak öğrenme hızını katlar." }
];

export async function getTeacherDashboardData() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 1. Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // 2. Fetch Basic Stats
    const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', user.id) as { data: { id: string }[] | null };

    const { data: groups } = await supabase
        .from('groups')
        .select('id, title, enrollments(count)')
        .eq('teacher_id', user.id) as { data: { id: string, title: string, enrollments: { count: number }[] }[] | null };

    const { data: students } = await supabase
        .from('enrollments')
        .select('student_id')
        .in('course_id', courses?.map(c => c.id) || []) as { data: { student_id: string }[] | null };

    const studentCount = new Set(students?.map(s => s.student_id)).size;

    // 3. Fetch Sessions
    const { data: allSessions } = await supabase
        .from('sessions')
        .select('*, courses(title)')
        .eq('teacher_id', user.id)
        .order('session_date', { ascending: true }) as { data: any[] | null };

    const now = new Date().toISOString();
    const nextSession = allSessions?.find(s => s.session_date >= now);
    const upcomingSessions = allSessions?.filter(s => s.session_date >= now).slice(0, 5);
    const completedSessions = allSessions?.filter(s => s.session_date < now).length || 0;

    // 4. Fetch Message Data
    const { count: unreadMessagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

    // 5. Build Activity Feed (New Students & Session Reminders)
    const { data: recentStudents } = await supabase
        .from('enrollments')
        .select('*, profiles:student_id(full_name), courses(title)')
        .in('course_id', courses?.map(c => c.id) || [])
        .order('created_at', { ascending: false })
        .limit(6) as { data: any[] | null };

    const activities = [
        ...(recentStudents?.map(s => ({
            type: 'ENROLLMENT',
            title: 'Yeni Kayıt',
            subtitle: `${s.profiles?.full_name} - ${s.courses?.title}`,
            date: s.created_at
        })) || []),
        ...(nextSession ? [{
            type: 'SESSION',
            title: 'Yaklaşan Ders',
            subtitle: nextSession.courses?.title,
            date: nextSession.session_date
        }] : [])
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    // 6. Platform Tips
    const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('teacher_tips')
        .single() as { data: { teacher_tips: any[] } | null };

    const tips = Array.isArray(platformSettings?.teacher_tips) ? platformSettings.teacher_tips : teacherTips;
    const currentTip = tips[Math.floor(Math.random() * tips.length)];

    return {
        profile,
        stats: {
            courses: courses?.length || 0,
            students: studentCount || 0,
            lessons: completedSessions,
            groups: groups?.length || 0,
            unreadMessages: unreadMessagesCount || 0
        },
        nextSession: nextSession ? {
            ...nextSession,
            course_title: (nextSession as any).courses?.title
        } : null,
        upcomingSessions: upcomingSessions?.map((s: any) => ({
            ...s,
            course_title: s.courses?.title
        })) || [],
        activityFeed: activities,
        taughtGroups: groups?.map((g: any) => ({
            ...g,
            student_count: g.enrollments?.[0]?.count || 0
        })) || [],
        currentTip
    };
}

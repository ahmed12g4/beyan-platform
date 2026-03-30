'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getUniqueVisitorCount } from './analytics'

export async function getDashboardStats() {
    const supabase = await createAdminClient()

    // 1. Fetch counts in parallel
    const [
        { count: totalUsers },
        { count: studentCount },
        { count: teacherCount },
        { count: adminCount },
        { count: publishedCourses },
        { count: pendingComments },
        { count: unreadInquiries },
        { count: pendingTeachers },
        visitorsCount
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('contact_messages' as any).select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher').eq('is_active', false),
        getUniqueVisitorCount()
    ])

    // 2. Fetch recent users
    const { data: recentProfiles } = await supabase
        .from('profiles')
        .select('full_name, role, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(15)

    // 3. Last 7 days enrollment data for chart
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(today.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
    })

    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('enrolled_at')
        .gte('enrolled_at', last7Days[0] + 'T00:00:00Z')

    const interactionData = last7Days.map(date => {
        return ((enrollments as any[]) || []).filter(e => e.enrolled_at.startsWith(date)).length
    })

    return {
        totalUsers: totalUsers || 0,
        studentCount: studentCount || 0,
        teacherCount: teacherCount || 0,
        adminCount: adminCount || 0,
        publishedCourses: publishedCourses || 0,
        pendingComments: pendingComments || 0,
        unreadInquiries: unreadInquiries || 0,
        pendingTeachers: pendingTeachers || 0,
        visitorsCount: visitorsCount || 0,
        recentUsers: (recentProfiles || []).map((p: any) => ({
            name: p.full_name || 'İsimsiz',
            action: 'yeni kayıt',
            createdAt: p.created_at
        })),
        interactionData,
        chartDays: last7Days
    }
}

'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function sendCourseAnnouncementAction({
    courseId,
    title,
    message,
    link
}: {
    courseId: string,
    title: string,
    message: string,
    link?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Oturum açılmadı.' }

    try {
        // 0. Verify teacher owns this course
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('teacher_id')
            .eq('id', courseId)
            .single()
        
        if (courseError || !course) throw new Error('Kurs bulunamadı.')
        if ((course as any).teacher_id !== user.id) {
            // Check if user is admin
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            if ((profile as any)?.role !== 'admin') {
                throw new Error('Bu kurs için duyuru gönderme yetkiniz yok.')
            }
        }

        // 1. Fetch all students enrolled in this course
        const { data: enrollments, error: enrollError } = await (supabase
            .from('enrollments') as any)
            .select('student_id')
            .eq('course_id', courseId)

        if (enrollError) throw enrollError
        if (!enrollments || enrollments.length === 0) {
            return { success: true, message: 'Kayıtlı öğrenci bulunamadı.', count: 0 }
        }

        const batchId = crypto.randomUUID()
        const notifications = enrollments.map((enroll: any) => ({
            user_id: enroll.student_id,
            sender_id: user.id,
            title,
            message,
            type: 'COURSE_UPDATE',
            link: link || `/student/my-lessons/${courseId}`,
            batch_id: batchId
        }))

        // 2. Insert notifications in batches using admin client to bypass RLS
        const adminSupabase = await createAdminClient()
        const { error: notifyError } = await (adminSupabase
            .from('notifications') as any)
            .insert(notifications)

        if (notifyError) throw notifyError

        return { success: true, count: notifications.length }

    } catch (error: any) {
        console.error('Announcement Error:', error)
        return { success: false, error: error.message || 'Duyuru gönderilemedi.' }
    }
}

export async function getCourseAnnouncementsAction(courseId: string) {
    const supabase = await createClient()
    
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('type', 'COURSE_UPDATE')
            .contains('link', [courseId]) // Simple check if link contains courseId
            .order('created_at', { ascending: false })
            .limit(10)

        // Filter uniquely by batch_id if needed, or just return as is
        return { success: true, data: data || [] }
    } catch (error) {
        return { success: false, data: [] }
    }
}

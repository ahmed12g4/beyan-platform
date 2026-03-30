'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { courseSchema, type CourseInput } from '@/lib/validations/schemas'

export type ActionState = {
    success: boolean
    message?: string
    error?: string
    courseId?: string
}

async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data: profile } = await (supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id) as any)
        .single()

    return profile?.role === 'admin'
}

export async function getAdminTeachers() {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return []

        const supabase = await createClient()

        const { data, error } = await (supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('role', 'teacher') as any)

        if (error) throw error

        return data || []
    } catch (error) {
        console.error('Fetch admin teachers error:', error)
        return []
    }
}

export async function toggleCoursePublish(courseId: string, currentStatus: boolean): Promise<ActionState> {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) {
            return { success: false, error: 'Yetkisiz işlem' }
        }

        const supabase = await createClient()

        const { error } = await (supabase
            .from('courses' as any)
            .update({ is_published: !currentStatus } as any)
            .eq('id', courseId) as any)

        if (error) throw error

        revalidatePath('/admin/courses')
        return { success: true, message: 'Kurs yayın durumu güncellendi' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteCourse(courseId: string): Promise<ActionState> {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) {
            return { success: false, error: 'Yetkisiz işlem' }
        }

        const supabase = await createClient()

        // Delete course (cascade should handle related data like lessons, enrollments)
        const { error } = await (supabase
            .from('courses')
            .delete()
            .eq('id', courseId) as any)

        if (error) throw error

        revalidatePath('/admin/courses')
        return { success: true, message: 'Kurs başarıyla silindi' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getAdminCourses() {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return []

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                teacher:profiles!courses_teacher_id_fkey(full_name),
                enrollments(id)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Format data to include participant count
        return (data || []).map(course => ({
            ...(course as any),
            participant_count: (course as any).enrollments?.length || 0
        }))
    } catch (error) {
        console.error('Fetch admin courses error:', error)
        return []
    }
}

export async function createAdminCourseAction(input: CourseInput, teacherId: string): Promise<ActionState> {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) {
            return { success: false, error: 'Yetkisiz işlem' }
        }

        const validated = courseSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        const supabase = await createClient()

        const { data, error } = await (supabase
            .from('courses' as any)
            .insert({
                ...validated.data,
                teacher_id: teacherId,
            } as any)
            .select('id') as any)
            .single()

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Bu slug zaten kullanımda. Farklı bir slug seçin.' }
            }
            return { success: false, error: error.message }
        }

        // Notify Teacher
        await (supabase.from('notifications') as any).insert({
            user_id: teacherId, // Assuming teacherId is the profile uuid
            title: 'Yeni Kurs Ataması',
            message: `"${validated.data.title}" kursunun eğitmeni olarak atandınız.`,
            link: '/teacher/courses',
            type: 'SYSTEM'
        })

        revalidatePath('/courses')
        revalidatePath('/admin/courses')
        return { success: true, message: 'Kurs başarıyla oluşturuldu.', courseId: data.id }
    } catch (error: any) {
        return { success: false, error: error.message || 'Bir hata oluştu' }
    }
}

export async function updateAdminCourseAction(courseId: string, input: CourseInput, teacherId: string): Promise<ActionState> {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) {
            return { success: false, error: 'Yetkisiz işlem' }
        }

        const validated = courseSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        const supabase = await createClient()

        const { error } = await (supabase
            .from('courses' as any)
            .update({
                ...validated.data,
                teacher_id: teacherId,
            } as any)
            .eq('id', courseId) as any)

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Bu slug zaten kullanımda. Farklı bir slug seçin.' }
            }
            return { success: false, error: error.message }
        }

        // Notify Teacher
        await (supabase.from('notifications') as any).insert({
            user_id: teacherId,
            title: 'Kurs Güncellendi',
            message: `"${validated.data.title}" kurs bilgileriniz güncellendi.`,
            link: `/teacher/courses/${courseId}`,
            type: 'SYSTEM'
        })

        revalidatePath('/courses')
        revalidatePath(`/courses/${validated.data.slug}`)
        revalidatePath('/admin/courses')
        return { success: true, message: 'Kurs başarıyla güncellendi' }
    } catch (error: any) {
        return { success: false, error: error.message || 'Bir hata oluştu' }
    }
}

export async function getFreeCourseEnrollments(courseId: string) {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return []

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('enrollments')
            .select(`
                id,
                enrolled_at,
                is_free,
                student:profiles!enrollments_student_id_fkey(id, full_name, email, avatar_url)
            `)
            .eq('course_id', courseId)
            .eq('is_free', true)
            .eq('status', 'ACTIVE')
            .order('enrolled_at', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('getFreeCourseEnrollments error:', error)
        return []
    }
}

export async function grantFreeCourseAccess(courseId: string, studentId: string, courseName: string): Promise<ActionState> {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return { success: false, error: 'Yetkisiz işlem' }

        const supabase = await createClient()

        // Upsert enrollment
        const { error: enrollError } = await (supabase
            .from('enrollments') as any)
            .upsert({
                course_id: courseId,
                student_id: studentId,
                status: 'ACTIVE',
                is_free: true,
                enrolled_at: new Date().toISOString()
            }, { onConflict: 'student_id,course_id' })

        if (enrollError) throw enrollError

        // Send notification
        await (supabase.from('notifications') as any).insert({
            user_id: studentId,
            title: 'Ücretsiz Kurs Erişimi',
            message: `${courseName} kursuna ücretsiz erişiminiz aktif!`,
            link: '/student',
            type: 'ENROLLMENT'
        })

        revalidatePath('/admin/courses')
        revalidatePath('/student')
        revalidatePath('/student/courses')
        return { success: true, message: 'Ücretsiz erişim tanımlandı' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function revokeFreeCourseAccess(enrollmentId: string, studentId: string, courseName: string): Promise<ActionState> {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return { success: false, error: 'Yetkisiz işlem' }

        const supabase = await createClient()

        const { error: updateError } = await (supabase
            .from('enrollments') as any)
            .update({ status: 'INACTIVE' })
            .eq('id', enrollmentId)

        if (updateError) throw updateError

        // Send notification
        await (supabase.from('notifications') as any).insert({
            user_id: studentId,
            title: 'Kurs Erişiminiz Kaldırıldı',
            message: `${courseName} erişiminiz kaldırıldı.`,
            link: '/student',
            type: 'SYSTEM'
        })

        revalidatePath('/admin/courses')
        revalidatePath('/student')
        revalidatePath('/student/courses')
        return { success: true, message: 'Ücretsiz erişim kaldırıldı' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function searchStudents(query: string) {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return []

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .eq('role', 'student')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('searchStudents error:', error)
        return []
    }
}

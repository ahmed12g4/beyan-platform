'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations/schemas'
import type { ActionResult } from './auth'
import type { Profile } from '@/types/database'

// ─── Get Profile ───

export async function getProfile(userId: string): Promise<Profile | null> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    return data
}

// ─── Update Own Profile ───

export async function updateProfileAction(input: UpdateProfileInput): Promise<ActionResult> {
    try {
        const validated = updateProfileSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: validated.data.full_name,
                phone: validated.data.phone || null,
                bio: validated.data.bio || null,
            })
            .eq('id', user.id)

        if (error) return { success: false, error: error.message }

        revalidatePath('/', 'layout')
        return { success: true, message: 'Profil başarıyla güncellendi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Update Avatar ───

export async function updateAvatarAction(formData: FormData): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        const file = formData.get('avatar') as File
        if (!file || file.size === 0) {
            return { success: false, error: 'Dosya seçilmedi' }
        }

        if (file.size > 2 * 1024 * 1024) {
            return { success: false, error: 'Dosya boyutu 2MB\'dan küçük olmalı' }
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: 'Sadece JPEG, PNG ve WebP dosyaları kabul edilir' }
        }

        const ext = file.name.split('.').pop() || 'jpg'
        const filePath = `${user.id}/avatar.${ext}`

        // Upload to storage (upsert = overwrite if exists)
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true })

        if (uploadError) return { success: false, error: uploadError.message }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        // Update profile with avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id)

        if (updateError) return { success: false, error: updateError.message }

        revalidatePath('/', 'layout')
        return { success: true, message: 'Profil fotoğrafı güncellendi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Admin: Update User Profile ───

export async function adminUpdateUserAction(
    userId: string,
    updates: { full_name?: string; role?: string; is_active?: boolean }
): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // Verify admin role
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (adminProfile?.role !== 'admin') {
            return { success: false, error: 'Yetkiniz yok' }
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates as any)
            .eq('id', userId)

        if (error) return { success: false, error: error.message }

        revalidatePath('/admin/users')
        return { success: true, message: 'Kullanıcı güncellendi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Get All Users (Admin) ───

export async function getAllUsers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') {
        return []
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return []
    return data
}

// ─── Get Users by Role ───

export async function getUsersByRole(role: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') {
        return []
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', role as any)
        .order('created_at', { ascending: false })

    if (error) return []
    return data
}

// ─── Delete Own Account ───

// ─── Delete Own Account ───

export async function deleteMyAccount(): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    // Use admin client for deep cleanup
    const supabaseAdmin = await createAdminClient()

    try {
        const userId = user.id

        // 1. FORCE DELETE: Clean up Teacher resources first (Courses, Live Sessions)
        // This addresses the "foreign key constraint" errors by cleaning children first.

        // Delete own live sessions
        await supabaseAdmin.from('live_sessions').delete().eq('teacher_id', userId)

        // Delete own courses (Database should cascade lessons/enrollments, or we rely on deleteCourseAction logic)
        // We fetching IDs to log or be precise, but strict delete by teacher_id implies "wipe everything mine"

        const { data: teacherCourses } = await supabaseAdmin.from('courses').select('id').eq('teacher_id', userId)
        if (teacherCourses && teacherCourses.length > 0) {
            const courseIds = teacherCourses.map(c => c.id)
            // Delete enrollments for my courses (where I am the teacher)
            await supabaseAdmin.from('enrollments').delete().in('course_id', courseIds)
            // Delete the courses themselves
            await supabaseAdmin.from('courses').delete().in('id', courseIds)
        }

        // 2. Delete Student resources (same logic as admin's deleteUser)

        // Delete lesson_progress
        const { data: myEnrollments } = await supabaseAdmin
            .from('enrollments')
            .select('id')
            .eq('student_id', userId)

        if (myEnrollments && myEnrollments.length > 0) {
            const ids = myEnrollments.map(e => e.id)
            await supabaseAdmin.from('lesson_progress').delete().in('enrollment_id', ids)
        }

        // Delete my enrollments (where I am the student)
        await supabaseAdmin.from('enrollments').delete().eq('student_id', userId)

        // Delete comments
        await supabaseAdmin.from('comments').delete().eq('user_id', userId)



        // Delete profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profileError) throw profileError

        // Delete Auth User
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (authError) throw authError

        return { success: true, message: 'Hesabınız ve ilgili tüm veriler başarıyla silindi.' }
    } catch (error: any) {
        console.error('Self-delete error:', error)
        return { success: false, error: 'Hesap silinirken bir hata oluştu: ' + error.message }
    }
}

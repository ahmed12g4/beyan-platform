'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
    success: boolean
    message?: string
    error?: string
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

export async function getAdminGroups() {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return []

        const supabase = await createAdminClient()

        const { data, error } = await (supabase
            .from('groups')
            .select(`
                *,
                teacher:profiles(full_name),
                group_enrollments(id)
            `)
            .order('created_at', { ascending: false }) as any)

        if (error) throw error

        return (data || []).map((group: any) => ({
            ...group,
            student_count: group.group_enrollments?.length || 0
        }))
    } catch (error) {
        console.error('Fetch admin groups error:', error)
        return []
    }
}

export async function createAdminGroup(groupData: any, sessions: any[]) {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return { success: false, error: 'Yetkisiz işlem' }

        const supabase = await createAdminClient()

        // 1. Create the group
        const { data: group, error: groupError } = await (supabase
            .from('groups')
            .insert(groupData)
            .select() as any)
            .single()

        if (groupError) throw groupError

        // 2. Create the sessions
        if (sessions.length > 0) {
            const sessionsToInsert = sessions.map(s => ({
                ...s,
                group_id: group.id
            }))
            const { error: sessionError } = await (supabase
                .from('group_sessions') as any)
                .insert(sessionsToInsert)

            if (sessionError) throw sessionError
        }

        // Notify Teacher
        await (supabase.from('notifications') as any).insert({
            user_id: groupData.teacher_id,
            title: 'Yeni Grup Ataması',
            message: `"${groupData.title}" grubunun eğitmeni olarak atandınız.`,
            link: '/teacher/schedule',
            type: 'SYSTEM'
        })

        revalidatePath('/groups')
        revalidatePath('/admin/groups')
        return { success: true, message: 'Grup başarıyla oluşturuldu' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateAdminGroup(groupId: string, groupData: any, sessions: any[]) {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return { success: false, error: 'Yetkisiz işlem' }

        const supabase = await createAdminClient()

        // 1. Update the group
        const { error: groupError } = await (supabase
            .from('groups') as any)
            .update(groupData)
            .eq('id', groupId)

        if (groupError) throw groupError

        // 2. Sync sessions (Delete and Re-insert)
        const { error: deleteError } = await (supabase
            .from('group_sessions')
            .delete()
            .eq('group_id', groupId) as any)

        if (deleteError) throw deleteError

        if (sessions.length > 0) {
            const sessionsToInsert = sessions.map(s => ({
                ...s,
                group_id: groupId
            }))
            const { error: sessionError } = await (supabase
                .from('group_sessions') as any)
                .insert(sessionsToInsert)

            if (sessionError) throw sessionError
        }

        // Notify Teacher
        await (supabase.from('notifications') as any).insert({
            user_id: groupData.teacher_id,
            title: 'Grup Bilgileri Güncellendi',
            message: `"${groupData.title}" grup bilgileriniz güncellendi.`,
            link: '/teacher/schedule',
            type: 'SYSTEM'
        })

        revalidatePath('/groups')
        revalidatePath('/admin/groups')
        return { success: true, message: 'Grup başarıyla güncellendi' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteGroup(groupId: string) {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return { success: false, error: 'Yetkisiz işlem' }

        const supabase = await createAdminClient()

        // Cascade delete should handle sessions and enrollments
        const { error } = await (supabase
            .from('groups')
            .delete()
            .eq('id', groupId) as any)

        if (error) throw error

        revalidatePath('/groups')
        revalidatePath('/admin/groups')
        return { success: true, message: 'Grup silindi' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getGroupStudents(groupId: string) {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return []

        const supabase = await createAdminClient()

        const { data, error } = await (supabase
            .from('group_enrollments')
            .select(`
                *,
                student:profiles!group_enrollments_student_id_fkey(id, full_name, avatar_url, email)
            `)
            .eq('group_id', groupId) as any)

        if (error) {
            console.error('getGroupStudents error:', error)
            throw error
        }

        return data || []
    } catch (error) {
        console.error('Fetch group students error:', error)
        return []
    }
}

export async function addGroupStudent(groupId: string, studentId: string) {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return { success: false, error: 'Yetkisiz işlem' }

        const supabase = await createAdminClient()

        // Check if already enrolled
        const { data: existing, error: fetchError } = await (supabase
            .from('group_enrollments')
            .select('id, status')
            .eq('group_id', groupId)
            .eq('student_id', studentId) as any)
            .maybeSingle()

        if (existing) {
            if (existing.status === 'active') {
                return { success: false, error: 'Öğrenci zaten bu grupta kayıtlı' }
            } else {
                // Reactivate if it was something else
                const { error: updateError } = await (supabase
                    .from('group_enrollments') as any)
                    .update({ status: 'active' })
                    .eq('id', existing.id)
                if (updateError) throw updateError

                revalidatePath('/admin/groups')
                return { success: true, message: 'Öğrenci kaydı aktifleştirildi' }
            }
        }

        const { error } = await (supabase
            .from('group_enrollments') as any)
            .insert({
                group_id: groupId,
                student_id: studentId,
                status: 'active'
            })

        if (error) {
            console.error('Insert enrollment error:', error)
            throw error
        }

        // Send notification to student
        const { data: groupName } = await (supabase.from('groups').select('title').eq('id', groupId).single() as any)
        await (supabase.from('notifications') as any).insert({
            user_id: studentId,
            title: 'Yeni Grup Kaydı',
            message: `"${groupName?.title || 'Gruba'}" başarıyla eklendiniz.`,
            link: '/student/my-lessons',
            type: 'ENROLLMENT'
        })

        revalidatePath('/admin/groups')
        revalidatePath('/student')
        revalidatePath('/student/my-lessons')
        revalidatePath('/student/schedule')
        return { success: true, message: 'Öğrenci gruba eklendi' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function removeGroupStudent(enrollmentId: string) {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return { success: false, error: 'Yetkisiz işlem' }

        const supabase = await createAdminClient()

        const { error } = await (supabase
            .from('group_enrollments')
            .delete()
            .eq('id', enrollmentId) as any)

        if (error) throw error

        revalidatePath('/admin/groups')
        return { success: true, message: 'Öğrenci gruptan çıkarıldı' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getStudentsSearch(search: string) {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) return []

        const supabase = await createAdminClient()

        // Search by name or email
        const { data, error } = await (supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .eq('role', 'student')
            .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
            .limit(15) as any)

        if (error) throw error

        return data || []
    } catch (error) {
        console.error('Search students error:', error)
        return []
    }
}

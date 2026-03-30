'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
    success: boolean
    message?: string
    error?: string
}

/**
 * Checks if the current user is an admin.
 */
async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    return (profile as any)?.role === 'admin'
}

/**
 * Toggles the active status of a user.
 */
export async function toggleUserStatus(userId: string, currentStatus: boolean): Promise<ActionState> {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) {
            return { success: false, error: 'Yetkisiz işlem' }
        }

        const newStatus = !currentStatus
        const supabaseAdmin = await createAdminClient()

        // Update profile in DB
        const { error } = await (supabaseAdmin
            .from('profiles') as any)
            .update({ is_active: newStatus })
            .eq('id', userId)

        if (error) throw error

        // ── Sync to JWT user_metadata so middleware sees the change immediately ──
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { is_active: newStatus },
        })

        revalidatePath('/admin/users')
        return { success: true, message: 'Kullanıcı durumu güncellendi' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Deletes a user completely.
 * We rely on ON DELETE CASCADE defined in the database schema to remove related data.
 */
export async function deleteUser(userId: string): Promise<ActionState> {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) {
            return { success: false, error: 'Yetkisiz işlem' }
        }

        // Use admin client to bypass RLS for thorough cleanup
        const supabaseAdmin = await createAdminClient()

        // Delete the profile (Related data via ON DELETE CASCADE will be removed automatically)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profileError) {
            console.error('Profile delete error:', profileError)
            return { success: false, error: 'Profil silinemedi: ' + profileError.message }
        }

        // Delete from Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (authError) {
            console.error('Auth delete error (non-critical):', authError)
            // Profile is already deleted, so user can't access anything
        }

        revalidatePath('/admin/users')
        return { success: true, message: 'Kullanıcı ve tüm verileri kalıcı olarak silindi' }
    } catch (error: any) {
        console.error('deleteUser error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Updates a user's role (student, teacher, admin).
 * Role → is_active logic:
 *   student  → true  (immediately active)
 *   teacher  → false (pending admin approval)
 *   admin    → true  (immediately active)
 */
export async function updateUserRole(userId: string, newRole: string): Promise<ActionState> {
    try {
        const isAdmin = await checkAdmin()
        if (!isAdmin) {
            return { success: false, error: 'Yetkisiz işlem' }
        }

        const validRoles = ['student', 'teacher', 'admin']
        if (!validRoles.includes(newRole)) {
            return { success: false, error: 'Geçersiz rol' }
        }

        const supabaseAdmin = await createAdminClient()

        // Determine the correct is_active value for this role
        const newIsActive = newRole === 'teacher' ? false : true

        // ── 1. Update the profiles table (critical) ──────────────────────────
        const { error: profileError } = await (supabaseAdmin
            .from('profiles') as any)
            .update({ role: newRole as any, is_active: newIsActive })
            .eq('id', userId)

        if (profileError) {
            console.error('[updateUserRole] profiles update error:', profileError)
            return { success: false, error: 'Profil güncellenemedi: ' + profileError.message }
        }

        // ── 2. Sync JWT metadata (best-effort — DB trigger also handles this) ─
        // We intentionally do NOT throw here; a failure just means the user
        // may need to log out/in for the new role to be reflected in their JWT.
        try {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: { role: newRole, is_active: newIsActive },
            })
            if (authError) {
                console.warn('[updateUserRole] JWT metadata sync warning:', authError.message)
            }
        } catch (syncErr) {
            console.warn('[updateUserRole] JWT metadata sync failed (non-critical):', syncErr)
        }

        revalidatePath('/admin/users')

        const roleLabels: Record<string, string> = {
            student: 'Öğrenci',
            teacher: 'Öğretmen',
            admin: 'Yönetici',
        }

        const note = newRole === 'teacher' ? ' (Onay bekliyor)' : ''
        return { success: true, message: `Rol "${roleLabels[newRole]}" olarak güncellendi${note}` }
    } catch (error: any) {
        console.error('[updateUserRole] unexpected error:', error)
        return { success: false, error: error.message }
    }
}

// ─── Get Users (Admin) ───

export async function getUsers(
    page: number = 1,
    limit: number = 20,
    search: string = '',
    role: string = 'ALL'
): Promise<{ data: any[]; totalCount: number }> {
    const supabase = await createClient()

    // Check admin
    const isAdmin = await checkAdmin()
    if (!isAdmin) return { data: [], totalCount: 0 }

    let query = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: false })
        .not('email', 'like', 'student_%@example.com') // Hide the fake review accounts from admin list

    // Apply filtering
    if (role && role !== 'ALL') {
        if (role === 'PENDING') {
            query = query.eq('role', 'teacher').eq('is_active', false)
        } else if (role === 'TEACHERS') {
            query = query.eq('role', 'teacher')
        } else if (role === 'STUDENTS') {
            query = query.eq('role', 'student')
        } else if (role === 'ADMINS') {
            query = query.eq('role', 'admin')
        }
    }

    if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Pagination range
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) return { data: [], totalCount: 0 }

    return {
        data: data || [],
        totalCount: count || 0
    }
}

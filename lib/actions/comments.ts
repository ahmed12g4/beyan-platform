'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { commentSchema, type CommentInput } from '@/lib/validations/schemas'
import type { ActionResult } from './auth'
// Removed import: CommentWithUser
export type CommentWithUser = any;

// ─── Get Approved Comments for Course ───

export async function getApprovedComments(courseId: string): Promise<CommentWithUser[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('comments')
        .select(`
      *,
      user:profiles!comments_user_id_fkey(id, full_name, avatar_url),
      course:courses!comments_course_id_fkey(id, title, slug)
    `)
        .eq('course_id', courseId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

    if (error) return []
    return (data || []) as unknown as CommentWithUser[]
}

// ─── Get All Comments for Homepage Reviews ───

export async function getAllApprovedComments(): Promise<CommentWithUser[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('comments')
        .select(`
      *,
      user:profiles!comments_user_id_fkey(id, full_name, avatar_url),
      course:courses!comments_course_id_fkey(id, title, slug)
    `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) return []
    return (data || []) as unknown as CommentWithUser[]
}

// ─── Get All Comments (Admin) ───

export async function getAllComments(): Promise<CommentWithUser[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('comments')
        .select(`
      *,
      user:profiles!comments_user_id_fkey(id, full_name, avatar_url),
      course:courses!comments_course_id_fkey(id, title, slug)
    `)
        .order('created_at', { ascending: false })

    if (error) return []
    return (data || []) as unknown as CommentWithUser[]
}

// ─── Create Comment ───

export async function createCommentAction(courseId: string, input: CommentInput): Promise<ActionResult> {
    try {
        const validated = commentSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // Check if user has COMPLETED the course
        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('status')
            .eq('course_id', courseId)
            .eq('student_id', user.id)
            .single()

        if (!enrollment || (enrollment as any).status !== 'COMPLETED') {
            return { success: false, error: 'Değerlendirme yapabilmek için kursu tamamlamanız gerekmektedir.' }
        }

        const { error } = await (supabase
            .from('comments') as any)
            .insert({
                user_id: user.id,
                course_id: courseId,
                content: validated.data.content,
                author_name: user.user_metadata?.full_name || 'Öğrenci',
                rating: validated.data.rating || null,
            })

        if (error) return { success: false, error: error.message }

        revalidatePath(`/student/course/${courseId}`)

        return { success: true, message: 'Yorumunuz gönderildi. Onay sonrası yayınlanacaktır.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Submit General Platform Review (from Student Dashboard) ───
// Rules:
//  • Only ONE general review per student account (lifetime)
//  • Author name is ALWAYS taken from the profile — not user-supplied
//  • Requires admin approval before appearing on homepage

export async function submitGeneralReviewAction(input: {
    content: string
    rating: number
}): Promise<ActionResult> {
    try {
        if (!input.content || input.content.trim().length < 10) {
            return { success: false, error: 'Yorum en az 10 karakter olmalıdır.' }
        }
        if (!input.rating || input.rating < 1 || input.rating > 5) {
            return { success: false, error: 'Lütfen 1-5 arasında bir puan seçin.' }
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı. Lütfen giriş yapın.' }

        // Fetch profile for the immutable display name
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        const authorName =
            (profile as any)?.full_name ||
            user.user_metadata?.full_name ||
            'Öğrenci'

        // ── LIFETIME CHECK: each student can only ever submit ONE general review ──
        const { data: existingReview } = await supabase
            .from('comments')
            .select('id, is_approved')
            .eq('user_id', user.id)
            .is('course_id', null)
            .maybeSingle()

        if (existingReview) {
            if ((existingReview as any).is_approved) {
                return {
                    success: false,
                    error: 'Daha önce gönderdiğiniz değerlendirme zaten yayında. Teşekkür ederiz!'
                }
            }
            return {
                success: false,
                error: 'Zaten bir değerlendirme gönderdiniz. Yönetici onayı bekleniyor.'
            }
        }

        const { error } = await (supabase
            .from('comments') as any)
            .insert({
                user_id: user.id,
                course_id: null,            // General review — not tied to a course
                content: input.content.trim(),
                author_name: authorName,    // Always from profile — cannot be overridden
                rating: input.rating,
                is_approved: false,         // Requires admin approval
            })

        if (error) return { success: false, error: error.message }

        revalidatePath('/admin/reviews')

        return {
            success: true,
            message: 'Değerlendirmeniz başarıyla gönderildi! Yönetici onayından sonra ana sayfada yayınlanacaktır.'
        }
    } catch {
        return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
    }
}

// ─── Approve Comment (Admin) ───

export async function approveCommentAction(commentId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if ((profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz erişim' }
        }

        const { error } = await (supabase
            .from('comments') as any)
            .update({ is_approved: true })
            .eq('id', commentId)

        if (error) return { success: false, error: error.message }

        revalidatePath('/admin/reviews')
        revalidatePath('/reviews')
        revalidatePath('/')
        return { success: true, message: 'Yorum onaylandı.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Reject Comment (Admin) ───

export async function rejectCommentAction(commentId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if ((profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz erişim' }
        }

        const { error } = await (supabase
            .from('comments') as any)
            .update({ is_approved: false })
            .eq('id', commentId)

        if (error) return { success: false, error: error.message }

        revalidatePath('/admin/reviews')
        return { success: true, message: 'Yorum reddedildi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Delete Comment ───

export async function deleteCommentAction(commentId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if ((profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz erişim' }
        }

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)

        if (error) return { success: false, error: error.message }

        revalidatePath('/admin/reviews')
        return { success: true, message: 'Yorum silindi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

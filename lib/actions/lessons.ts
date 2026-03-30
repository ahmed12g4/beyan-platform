'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { lessonSchema, type LessonInput } from '@/lib/validations/schemas'
import type { ActionResult } from './auth'
import type { Lesson } from '@/types/database'

// ─── Get Lessons for Course ───

export async function getCourseLessons(courseId: string): Promise<Lesson[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

    if (error) return []
    return data || []
}

// ─── Get Published Lessons for Course (student view) ───

export async function getPublishedLessons(courseId: string): Promise<Lesson[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true })

    if (error) return []
    return data || []
}

// ─── Get Single Lesson ───

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

    if (error) return null
    return data
}

// ─── Create Lesson ───

export async function createLessonAction(courseId: string, input: LessonInput): Promise<ActionResult & { lessonId?: string }> {
    try {
        const validated = lessonSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // Authorization check
        const [{ data: course }, { data: profile }] = await Promise.all([
            supabase.from('courses').select('teacher_id').eq('id', courseId).single(),
            supabase.from('profiles').select('role').eq('id', user.id).single(),
        ])
        if (!course) return { success: false, error: 'Kurs bulunamadı' }
        if ((course as any).teacher_id !== user.id && (profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz işlem: bu kursa ders ekleyemezsiniz' }
        }

        // Get the next order_index
        const { data: existingLessons } = await supabase
            .from('lessons')
            .select('order_index')
            .eq('course_id', courseId)
            .order('order_index', { ascending: false })
            .limit(1)

        const nextOrderIndex = existingLessons && existingLessons.length > 0
            ? (existingLessons[0] as any).order_index + 1
            : 0

        const { data, error } = await (supabase
            .from('lessons') as any)
            .insert({
                course_id: courseId,
                title: validated.data.title,
                description: validated.data.description || null,
                order_index: validated.data.order_index ?? nextOrderIndex,
                duration_minutes: validated.data.duration_minutes,
                lesson_type: validated.data.lesson_type,
                video_url: validated.data.video_url || null,
                scheduled_at: validated.data.scheduled_at || null,
                meeting_link: validated.data.meeting_link || null,
                is_published: validated.data.is_published,
                is_free_preview: validated.data.is_free_preview,
            })
            .select('id')
            .single()

        if (error) return { success: false, error: error.message }

        revalidatePath(`/teacher/courses/${courseId}`)



        return { success: true, message: 'Ders oluşturuldu.', lessonId: data.id }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Update Lesson ───

export async function updateLessonAction(lessonId: string, input: Partial<LessonInput>): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // Authorization check
        const { data: lesson } = await supabase.from('lessons').select('course_id').eq('id', lessonId).single()
        if (!lesson) return { success: false, error: 'Ders bulunamadı' }

        const [{ data: course }, { data: profile }] = await Promise.all([
            supabase.from('courses').select('teacher_id').eq('id', (lesson as any).course_id).single(),
            supabase.from('profiles').select('role').eq('id', user.id).single(),
        ])
        if ((course as any)?.teacher_id !== user.id && (profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz işlem: bu dersi düzenleyemezsiniz' }
        }

        const updateData: Record<string, unknown> = {}
        if (input.title !== undefined) updateData.title = input.title
        if (input.description !== undefined) updateData.description = input.description || null
        if (input.order_index !== undefined) updateData.order_index = input.order_index
        if (input.duration_minutes !== undefined) updateData.duration_minutes = input.duration_minutes
        if (input.lesson_type !== undefined) updateData.lesson_type = input.lesson_type
        if (input.video_url !== undefined) updateData.video_url = input.video_url || null
        if (input.scheduled_at !== undefined) updateData.scheduled_at = input.scheduled_at || null
        if (input.meeting_link !== undefined) updateData.meeting_link = input.meeting_link || null
        if (input.is_published !== undefined) updateData.is_published = input.is_published
        if (input.is_free_preview !== undefined) updateData.is_free_preview = input.is_free_preview

        const { error } = await (supabase
            .from('lessons') as any)
            .update(updateData)
            .eq('id', lessonId)

        if (error) return { success: false, error: error.message }

        revalidatePath('/teacher/courses')
        return { success: true, message: 'Ders güncellendi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Delete Lesson ───

export async function deleteLessonAction(lessonId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // Authorization check
        const { data: lesson } = await supabase.from('lessons').select('course_id').eq('id', lessonId).single()
        if (!lesson) return { success: false, error: 'Ders bulunamadı' }

        const [{ data: course }, { data: profile }] = await Promise.all([
            supabase.from('courses').select('teacher_id').eq('id', (lesson as any).course_id).single(),
            supabase.from('profiles').select('role').eq('id', user.id).single(),
        ])
        if ((course as any)?.teacher_id !== user.id && (profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz işlem: bu dersi silemezsiniz' }
        }
        const { error } = await (supabase
            .from('lessons') as any)
            .delete()
            .eq('id', lessonId)

        if (error) return { success: false, error: error.message }

        revalidatePath('/teacher/courses')
        return { success: true, message: 'Ders silindi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Reorder Lessons ───

export async function reorderLessonsAction(
    lessons: { id: string; order_index: number }[]
): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        if (lessons.length > 0) {
            // Check auth for the first lesson (assumes all belong to same course)
            const { data: lesson } = await supabase.from('lessons').select('course_id').eq('id', lessons[0].id).single()
            if (!lesson) return { success: false, error: 'Ders bulunamadı' }

            const [{ data: course }, { data: profile }] = await Promise.all([
                supabase.from('courses').select('teacher_id').eq('id', (lesson as any).course_id).single(),
                supabase.from('profiles').select('role').eq('id', user.id).single(),
            ])
            if ((course as any)?.teacher_id !== user.id && (profile as any)?.role !== 'admin') {
                return { success: false, error: 'Yetkisiz işlem: bu dersleri sıralayamazsınız' }
            }
        }

        // Update each lesson's order_index
        const updates = lessons.map(({ id, order_index }) =>
            (supabase.from('lessons') as any).update({ order_index }).eq('id', id)
        )

        const results = await Promise.all(updates)
        const hasError = results.some((r) => r.error)

        if (hasError) return { success: false, error: 'Sıralama güncellenirken hata oluştu.' }

        revalidatePath('/teacher/courses')
        return { success: true, message: 'Ders sıralaması güncellendi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}
// ─── Start Live Session ───

export async function startLiveSessionAction(lessonId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // Authorization check
        const { data: lesson } = await supabase.from('lessons').select('course_id').eq('id', lessonId).single()
        if (!lesson) return { success: false, error: 'Ders bulunamadı' }

        const [{ data: course }, { data: profile }] = await Promise.all([
            supabase.from('courses').select('teacher_id').eq('id', (lesson as any).course_id).single(),
            supabase.from('profiles').select('role').eq('id', user.id).single(),
        ])
        if ((course as any)?.teacher_id !== user.id && (profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz işlem: bu dersi başlatamazsınız' }
        }

        // Start session (update status to LIVE)
        const { error } = await (supabase
            .from('lessons') as any)
            .update({ status: 'LIVE' as const })
            .eq('id', lessonId)

        if (error) return { success: false, error: error.message }



        revalidatePath('/teacher/courses')
        revalidatePath('/student')
        return { success: true, message: 'Canlı ders başlatıldı! Öğrencilere bildirim gönderildi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

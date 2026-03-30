'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { courseSchema, type CourseInput } from '@/lib/validations/schemas'
import type { ActionResult } from './auth'
import type { Course, CourseWithTeacher, CourseWithTeacherAndStats } from '@/types/database'

// ─── Get Published Courses (Public) ───

export async function getPublishedCourses(
    page: number = 1,
    limit: number = 9
): Promise<{ data: CourseWithTeacherAndStats[]; totalCount: number }> {
    const supabase = await createClient()

    // Calculate range for pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Get total count first
    const { count, error: countError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)

    if (countError) return { data: [], totalCount: 0 }

    // Get paginated data
    const { data, error } = await supabase
        .from('courses')
        .select(`
      *,
      teacher:profiles!courses_teacher_id_fkey(id, full_name, avatar_url, bio)
    `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) return { data: [], totalCount: 0 }

    return {
        data: (data || []) as unknown as CourseWithTeacherAndStats[],
        totalCount: count || 0
    }
}

// ─── Get Course by Slug (Public) ───

export async function getCourseBySlug(slug: string): Promise<CourseWithTeacherAndStats | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('courses')
        .select(`
      *,
      teacher:profiles!courses_teacher_id_fkey(id, full_name, avatar_url, bio)
    `)
        .eq('slug', slug)
        .single()

    if (error) return null
    return data as unknown as CourseWithTeacherAndStats
}

// ─── Get Teacher's Courses ───

export async function getTeacherCourses(teacherId?: string): Promise<CourseWithTeacherAndStats[]> {
    const supabase = await createClient()

    let queryTeacherId = teacherId
    if (!queryTeacherId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        queryTeacherId = user.id
    }

    const { data, error } = await supabase
        .from('courses')
        .select(`
      *,
      teacher:profiles!courses_teacher_id_fkey(id, full_name, avatar_url, bio)
    `)
        .eq('teacher_id', queryTeacherId)
        .order('created_at', { ascending: false })

    if (error) return []
    return (data || []) as unknown as CourseWithTeacherAndStats[]
}

// ─── Get All Courses (Admin) ───

export async function getAllCourses(
    page: number = 1,
    limit: number = 20
): Promise<{ data: CourseWithTeacherAndStats[]; totalCount: number }> {
    const supabase = await createClient()

    // Calculate range for pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Get total count first
    const { count, error: countError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })

    if (countError) return { data: [], totalCount: 0 }

    const { data, error } = await supabase
        .from('courses')
        .select(`
      *,
      teacher:profiles!courses_teacher_id_fkey(id, full_name, avatar_url, bio)
    `)
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) return { data: [], totalCount: 0 }

    return {
        data: (data || []) as unknown as CourseWithTeacherAndStats[],
        totalCount: count || 0
    }
}

// ─── Get Single Course by ID ───

export async function getCourseById(courseId: string): Promise<CourseWithTeacherAndStats | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('courses')
        .select(`
      *,
      teacher:profiles!courses_teacher_id_fkey(id, full_name, avatar_url, bio)
    `)
        .eq('id', courseId)
        .single()

    if (error) return null
    return data as unknown as CourseWithTeacherAndStats
}

// ─── Create Course ───

export async function createCourseAction(input: CourseInput): Promise<ActionResult & { courseId?: string }> {
    try {
        const validated = courseSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if ((profile as any)?.role !== 'teacher' && (profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz işlem: kurs oluşturmak için eğitmen olmalısınız' }
        }

        const { data, error } = await (supabase
            .from('courses') as any)
            .insert({
                ...validated.data,
                teacher_id: user.id,
                level: validated.data.level || null,
                description: validated.data.description || null,
                thumbnail_url: validated.data.thumbnail_url || null,
                schedule: validated.data.schedule || null,
                duration_weeks: validated.data.duration_weeks || null,
                max_students: validated.data.max_students || null,
            })
            .select('id')
            .single()

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Bu slug zaten kullanımda. Farklı bir slug seçin.' }
            }
            return { success: false, error: error.message }
        }

        revalidatePath('/teacher/courses')
        revalidatePath('/kurslar')
        return { success: true, message: 'Kurs başarıyla oluşturuldu.', courseId: data.id }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Update Course ───

export async function updateCourseAction(courseId: string, input: Partial<CourseInput>): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // ── Authorization: must own the course OR be an admin ────────────
        const [{ data: course }, { data: profile }] = await Promise.all([
            supabase.from('courses').select('teacher_id').eq('id', courseId).single(),
            supabase.from('profiles').select('role').eq('id', user.id).single(),
        ])
        if (!course) return { success: false, error: 'Kurs bulunamadı' }
        if ((course as any).teacher_id !== user.id && (profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz işlem: bu kursu düzenleyemezsiniz' }
        }
        // ────────────────────────────────────────────────────────────────

        const updateData: Record<string, unknown> = {}
        if (input.title !== undefined) updateData.title = input.title
        if (input.slug !== undefined) updateData.slug = input.slug
        if (input.description !== undefined) updateData.description = input.description || null
        if (input.thumbnail_url !== undefined) updateData.thumbnail_url = input.thumbnail_url || null
        if (input.level !== undefined) updateData.level = input.level || null
        if (input.course_type !== undefined) updateData.course_type = input.course_type
        if (input.price !== undefined) updateData.price = input.price
        if (input.duration_weeks !== undefined) updateData.duration_weeks = input.duration_weeks || null
        if (input.schedule !== undefined) updateData.schedule = input.schedule || null
        if (input.color !== undefined) updateData.color = input.color
        if (input.is_published !== undefined) updateData.is_published = input.is_published
        if (input.max_students !== undefined) updateData.max_students = input.max_students || null

        const { error } = await (supabase
            .from('courses') as any)
            .update(updateData)
            .eq('id', courseId)

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Bu slug zaten kullanımda.' }
            }
            return { success: false, error: error.message }
        }

        revalidatePath('/teacher/courses')
        revalidatePath('/kurslar')
        revalidatePath(`/kurslar/${input.slug}`)
        return { success: true, message: 'Kurs güncellendi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Delete Course ───

export async function deleteCourseAction(courseId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // ── Authorization: must own the course OR be an admin ────────────
        const [{ data: course }, { data: profile }] = await Promise.all([
            supabase.from('courses').select('teacher_id').eq('id', courseId).single(),
            supabase.from('profiles').select('role').eq('id', user.id).single(),
        ])
        if (!course) return { success: false, error: 'Kurs bulunamadı' }
        if ((course as any).teacher_id !== user.id && (profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz işlem: bu kursu silemezsiniz' }
        }
        // ────────────────────────────────────────────────────────────────

        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseId)

        if (error) return { success: false, error: error.message }

        revalidatePath('/teacher/courses')
        revalidatePath('/admin/courses')
        revalidatePath('/kurslar')
        return { success: true, message: 'Kurs silindi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Toggle Course Publish ───

export async function toggleCoursePublishAction(courseId: string, isPublished: boolean): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // ── Authorization: must own the course OR be an admin ────────────
        const [{ data: course }, { data: profile }] = await Promise.all([
            supabase.from('courses').select('teacher_id').eq('id', courseId).single(),
            supabase.from('profiles').select('role').eq('id', user.id).single(),
        ])
        if (!course) return { success: false, error: 'Kurs bulunamadı' }
        if ((course as any).teacher_id !== user.id && (profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz işlem' }
        }
        // ────────────────────────────────────────────────────────────────

        const { error } = await (supabase
            .from('courses') as any)
            .update({ is_published: isPublished })
            .eq('id', courseId)

        if (error) return { success: false, error: error.message }

        revalidatePath('/teacher/courses')
        revalidatePath('/admin/courses')
        revalidatePath('/kurslar')
        return { success: true, message: isPublished ? 'Kurs yayınlandı.' : 'Kurs yayından kaldırıldı.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Upload Course Thumbnail ───

export async function uploadCourseThumbnailAction(courseId: string, formData: FormData): Promise<ActionResult> {
    try {
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
            return { success: false, error: 'Yetkisiz işlem' }
        }

        const file = formData.get('thumbnail') as File
        if (!file || file.size === 0) {
            return { success: false, error: 'Dosya seçilmedi' }
        }

        if (file.size > 5 * 1024 * 1024) {
            return { success: false, error: 'Dosya boyutu 5MB\'dan küçük olmalı' }
        }

        const ext = file.name.split('.').pop() || 'jpg'
        const filePath = `${courseId}/thumbnail.${ext}`

        const { error: uploadError } = await supabase.storage
            .from('course-thumbnails')
            .upload(filePath, file, { upsert: true })

        if (uploadError) return { success: false, error: uploadError.message }

        const { data: { publicUrl } } = supabase.storage
            .from('course-thumbnails')
            .getPublicUrl(filePath)

        const { error: updateError } = await (supabase
            .from('courses') as any)
            .update({ thumbnail_url: publicUrl })
            .eq('id', courseId)

        if (updateError) return { success: false, error: updateError.message }

        revalidatePath('/teacher/courses')
        revalidatePath('/kurslar')
        return { success: true, message: 'Kurs fotoğrafı güncellendi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

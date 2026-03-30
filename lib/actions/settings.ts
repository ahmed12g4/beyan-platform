'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { platformSettingsSchema, type PlatformSettingsInput } from '@/lib/validations/settings-schema'
// import type { ActionResult } from './auth' // Removed to break dependency chain
import type { PlatformSettings } from '@/types/database'

export type ActionResult = {
    success: boolean
    error?: string
    message?: string
}

// ─── Get Platform Settings ───

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 1)
        .single()

    if (error) {
        return null
    }
    return data
}

// ─── Update Platform Settings ───

export async function updatePlatformSettingsAction(input: PlatformSettingsInput): Promise<ActionResult> {
    try {
        const validated = platformSettingsSchema.safeParse(input)
        if (!validated.success) {
            console.error('Settings Validation Error:', validated.error)
            return { success: false, error: 'Geçersiz veri formatı: ' + validated.error.issues[0].message }
        }


        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // Verify admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        if ((profile as any)?.role !== 'admin') return { success: false, error: 'Yetkiniz yok' }

        const { error } = await (supabase
            .from('platform_settings' as any) as any)
            .upsert({
                id: 1, // Ensure we are updating the main settings row
                site_name: validated.data.site_name,
                site_description: validated.data.site_description || null,
                site_url: validated.data.site_url || null,
                contact_email: validated.data.contact_email || null,
                support_email: validated.data.support_email || null,
                max_enrollments_per_user: validated.data.max_enrollments_per_user,
                allow_new_registrations: validated.data.allow_new_registrations,
                maintenance_mode: validated.data.maintenance_mode,
                announcement_bar_enabled: validated.data.announcement_bar_enabled,
                announcement_text: validated.data.announcement_text || '',
                announcement_color: validated.data.announcement_color,
                announcement_text_color: validated.data.announcement_text_color,
                announcement_marquee: validated.data.announcement_marquee,


                logo_url: validated.data.logo_url,
                favicon_url: validated.data.favicon_url,

                hero_title: validated.data.hero_title,
                hero_description: validated.data.hero_description,
                hero_image_url: validated.data.hero_image_url,
                hero_cta_text: validated.data.hero_cta_text,
                hero_cta_link: validated.data.hero_cta_link,
                hero_cta_visible: validated.data.hero_cta_visible,

                footer_description: validated.data.footer_description,
                footer_copyright: validated.data.footer_copyright,
                contact_phone: validated.data.contact_phone,
                contact_address: validated.data.contact_address,
                qr_code_url: validated.data.qr_code_url,

                social_links: validated.data.social_links || [],
                social_facebook: validated.data.social_facebook,
                social_instagram: validated.data.social_instagram,
                social_linkedin: validated.data.social_linkedin,
                social_whatsapp: validated.data.social_whatsapp,


                features_section: validated.data.features_section || [],
                testimonials_section: validated.data.testimonials_section || [],
                gratitude_title: validated.data.gratitude_title,
                gratitude_section: validated.data.gratitude_section || [],
                founder_section: validated.data.founder_section || {},

                stats_courses_count: validated.data.stats_courses_count,
                stats_students_count: validated.data.stats_students_count,
                stats_satisfaction_rate: validated.data.stats_satisfaction_rate,

                student_terms: validated.data.student_terms,
                teacher_terms: validated.data.teacher_terms,

                student_tips: validated.data.student_tips || [],
                teacher_tips: validated.data.teacher_tips || [],

                how_it_works_title: (validated.data as any).how_it_works_title || null,
                how_it_works_subtitle: (validated.data as any).how_it_works_subtitle || null,
                how_it_works_section: (validated.data as any).how_it_works_section || [],

                google_analytics_id: validated.data.google_analytics_id,
                meta_pixel_id: validated.data.meta_pixel_id,

                // ── Brand Colors ──────────────────────────────────────────
                brand_primary_color: (validated.data as any).brand_primary_color || '#204544',
                brand_accent_color: (validated.data as any).brand_accent_color || '#FEDD59',
            })

        if (error) {
            console.error('Settings DB Error:', error)
            return { success: false, error: 'Veritabanı hatası: ' + error.message }
        }

        revalidatePath('/', 'layout')
        return { success: true, message: 'Ayarlar güncellendi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Get Dashboard Stats (Admin) ───

export async function getAdminDashboardStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as any)?.role !== 'admin') return null

    const [
        { count: totalUsers },
        { count: totalStudents },
        { count: totalTeachers },
        { count: totalCourses },
        { count: publishedCourses },
        { count: totalEnrollments },
        { count: activeEnrollments },
        { count: pendingComments },
    ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('is_approved', false),
    ])

    return {
        totalUsers: totalUsers || 0,
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        totalCourses: totalCourses || 0,
        publishedCourses: publishedCourses || 0,
        totalEnrollments: totalEnrollments || 0,
        activeEnrollments: activeEnrollments || 0,
        pendingComments: pendingComments || 0,
    }
}

// ─── Get Teacher Dashboard Stats ───

export async function getTeacherDashboardStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as any)?.role !== 'teacher' && (profile as any)?.role !== 'admin') return null

    const [
        { count: totalCourses },
        { count: publishedCourses },
        { data: courseIds },
    ] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id).eq('is_published', true),
        supabase.from('courses').select('id').eq('teacher_id', user.id),
    ])

    let totalStudents = 0
    let activeStudents = 0

    if (courseIds && courseIds.length > 0) {
        const ids = courseIds.map((c: any) => c.id)
        const [
            { count: enrolled },
            { count: active },
        ] = await Promise.all([
            supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('course_id', ids),
            supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('course_id', ids).eq('status', 'ACTIVE'),
        ])
        totalStudents = enrolled || 0
        activeStudents = active || 0
    }

    return {
        totalCourses: totalCourses || 0,
        publishedCourses: publishedCourses || 0,
        totalStudents,
        activeStudents,
    }
}

// ─── Upload Platform Asset ───

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'] as const
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'] as const
const MAX_ASSET_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function uploadPlatformAsset(formData: FormData): Promise<{ success: boolean, url?: string, error?: string }> {
    try {
        const file = formData.get('file') as File
        if (!file || file.size === 0) return { success: false, error: 'Dosya bulunamadı' }

        // ── File type/size validation ─────────────────────────────────────────────
        if (file.size > MAX_ASSET_SIZE_BYTES) {
            return { success: false, error: 'Dosya boyutu 5 MB\'dan büyük olamaz' }
        }
        const fileExt = file.name.split('.').pop()?.toLowerCase() ?? ''
        if (!(ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(fileExt)) {
            return { success: false, error: `İzin verilen uzantılar: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}` }
        }
        if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
            return { success: false, error: 'Geçersiz dosya türü. Sadece resim dosyaları yüklenebilir.' }
        }
        // ────────────────────────────────────────────────────────────────

        const supabase = await createClient()

        // Verify admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((profile as any)?.role !== 'admin') return { success: false, error: 'Yetkiniz yok' }

        const fileName = `platform-assets/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const arrayBuffer = await file.arrayBuffer()

        const { error: uploadError } = await supabase.storage
            .from('platform_assets')
            .upload(fileName, arrayBuffer, {
                contentType: file.type,
                upsert: true,
            })

        if (uploadError) {
            console.error('Supabase Storage Error:', uploadError)
            return { success: false, error: uploadError.message }
        }

        const { data: { publicUrl } } = supabase.storage
            .from('platform_assets')
            .getPublicUrl(fileName)

        return { success: true, url: publicUrl }
    } catch (e: any) {
        console.error('Upload Platform Asset Exception:', e)
        return { success: false, error: e?.message || 'Dosya yüklenirken bir hata oluştu' }
    }
}

// ─── Get Student Dashboard Stats ───

export async function getStudentDashboardStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [
        { count: enrolledCourses },
        { data: progressData },
        { count: completedCourses },
    ] = await Promise.all([
        supabase.from('enrollments').select('id', { count: 'exact', head: true })
            .eq('student_id', user.id).eq('status', 'ACTIVE'),
        supabase.from('enrollment_progress').select('*').eq('student_id', user.id),
        supabase.from('enrollments').select('id', { count: 'exact', head: true })
            .eq('student_id', user.id).eq('status', 'COMPLETED'),
    ])

    // Calculate overall progress
    let overallProgress = 0
    if (progressData && progressData.length > 0) {
        const totalProgress = progressData.reduce((acc, p: any) => acc + (p.progress_percentage || 0), 0)
        overallProgress = Math.round(totalProgress / progressData.length)
    }

    return {
        enrolledCourses: enrolledCourses || 0,
        completedCourses: completedCourses || 0,
        overallProgress,
        totalLessonsCompleted: progressData?.reduce((acc, p: any) => acc + (p.completed_lessons || 0), 0) || 0,
    }
}

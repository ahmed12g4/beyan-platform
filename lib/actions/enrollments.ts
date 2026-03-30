'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from './auth'
import type { Enrollment, EnrollmentWithCourse, EnrollmentProgress } from '@/types/database'
import { addXpAction } from './xp'

// ─── Get Student's Enrollments ───

export async function getStudentEnrollments(studentId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let queryStudentId = studentId || user.id

    // Check auth: only self or admin
    if (queryStudentId !== user.id) {
        const { data: profile } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
        if ((profile as any)?.role !== 'admin') return []
    }

    const { data, error } = await supabase
        .from('enrollments')
        .select(`
      *,
      course:courses(*)
    `)
        .eq('student_id', queryStudentId)
        .eq('status', 'ACTIVE')
        .order('enrolled_at', { ascending: false })

    if (error) return []
    return (data || []) as unknown as EnrollmentWithCourse[]
}

// ─── Get Student Enrollment Progress ───

export async function getStudentProgress(studentId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let queryStudentId = studentId || user.id

    // Check auth: only self or admin
    if (queryStudentId !== user.id) {
        const { data: profile } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
        if ((profile as any)?.role !== 'admin') return []
    }

    const { data, error } = await supabase
        .from('enrollment_progress')
        .select(`
      *,
      course:courses(*)
    `)
        .eq('student_id', queryStudentId)

    if (error) return []
    return data || []
}

// ─── Check if Student is Enrolled ───

export async function isStudentEnrolled(courseId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .eq('status', 'ACTIVE')
        .single()

    return !!data
}

// ─── Get Enrollment by Course ───

export async function getEnrollmentByCourse(courseId: string): Promise<Enrollment | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .single()

    return data
}

// ─── Enroll Student ───

export async function enrollStudentAction(courseId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // Check if already enrolled
        const { data: existing } = await (supabase
            .from('enrollments') as any)
            .select('id, status')
            .eq('student_id', user.id)
            .eq('course_id', courseId)
            .single()

        if (existing) {
            if (existing.status === 'ACTIVE') {
                return { success: false, error: 'Bu kursa zaten kayıtlısınız' }
            }
            // Re-activate if previously dropped
            // This block seems to be misplaced from an XP-related function.
            // Reverting to original logic for enrollments.
            const { error } = await (supabase
                .from('enrollments') as any)
                .update({ status: 'ACTIVE', last_accessed_at: new Date().toISOString() })
                .eq('id', existing.id)
            if (error) return { success: false, error: error.message }
        } else {
            // Check course details (Price & Capacity)
            const { data: course } = await supabase
                .from('courses')
                .select('max_students, price, is_subscription_only')
                .eq('id', courseId)
                .single()

            if (!course) return { success: false, error: 'Kurs bulunamadı' }

            // SECURITY: Prevent free enrollment in paid courses via this action
            if ((course as any).price > 0) {
                return { success: false, error: 'Bu ücretli bir kurstur. Lütfen satın alma adımlarını takip edin.' }
            }

            if ((course as any).max_students) {
                const { count } = await (supabase
                    .from('enrollments') as any)
                    .select('id', { count: 'exact', head: true })
                    .eq('course_id', courseId)
                    .eq('status', 'ACTIVE')

                if (count && count >= (course as any).max_students) {
                    return { success: false, error: 'Bu kurs dolu. Lütfen daha sonra tekrar deneyin.' }
                }
            }

            const { error } = await (supabase
                .from('enrollments') as any)
                .insert({
                    student_id: user.id,
                    course_id: courseId,
                })

            if (error) {
                if (error.code === '23505') {
                    return { success: false, error: 'Bu kursa zaten kayıtlısınız' }
                }
                return { success: false, error: error.message }
            }
        }

        revalidatePath('/student')
        revalidatePath('/student/courses')

        // Notify Teacher
        try {
            const { data: courseData } = await (supabase.from('courses').select('title, teacher_id').eq('id', courseId).single() as any)
            if (courseData?.teacher_id) {
                await (supabase.from('notifications') as any).insert({
                    user_id: courseData.teacher_id,
                    title: 'Yeni Kurs Kaydı',
                    message: `Bir öğrenci "${courseData.title}" kursuna kayıt oldu.`,
                    link: `/teacher/courses/${courseId}`,
                    type: 'SYSTEM'
                })
            }
        } catch (err) {
            console.error("Enrollment notification error:", err)
        }

        return { success: true, message: 'Kursa başarıyla kaydoldunuz!' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Drop Enrollment ───

export async function dropEnrollmentAction(courseId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } = {} } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        const { error } = await (supabase
            .from('enrollments') as any)
            .update({ status: 'DROPPED' })
            .eq('student_id', user.id)
            .eq('course_id', courseId)

        if (error) return { success: false, error: error.message }

        revalidatePath('/student')
        revalidatePath('/student/courses')
        return { success: true, message: 'Kurs kaydınız iptal edildi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Admin: Enroll Student in Course ───

export async function adminEnrollStudentAction(studentId: string, courseId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } = {} } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // Explicit ADMIN check to prevent unauthorized access
        const { data: profile } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
        if ((profile as any)?.role !== 'admin') return { success: false, error: 'Yetkisiz erişim' }

        // SECURITY: Prevent a user from enrolling themselves into a paid course via this admin action
        if (studentId === user.id) {
            const { data: course } = await supabase
                .from('courses')
                .select('price')
                .eq('id', courseId)
                .single()

            if (!course) {
                return { success: false, error: 'Kurs bulunamadı' }
            }

            if ((course as any).price > 0) {
                return { success: false, error: 'Bu ücretli bir kurstur. Lütfen satın alma adımlarını takip edin.' }
            }
        }

        const { error } = await (supabase
            .from('enrollments') as any)
            .insert({
                student_id: studentId,
                course_id: courseId,
            })

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Bu öğrenci zaten bu kursa kayıtlı' }
            }
            return { success: false, error: error.message }
        }

        // Notify Student
        const { data: courseData } = await (supabase.from('courses').select('title').eq('id', courseId).single() as any)
        await (supabase.from('notifications') as any).insert({
            user_id: studentId,
            title: 'Kursa Kaydedildiniz',
            message: `Yönetici sizi "${courseData?.title || 'Kursa'}" kaydetti.`,
            link: '/student/my-lessons',
            type: 'ENROLLMENT'
        })

        revalidatePath('/admin')
        return { success: true, message: 'Öğrenci kursa kaydedildi.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Get Course Students (Teacher) ───

export async function getCourseStudents(courseId: string) {
    const supabase = await createClient()
    const { data: { user } = {} } = await supabase.auth.getUser()
    if (!user) return []

    // Verify auth: must be the teacher of this course OR an admin
    const [{ data: course }, { data: profile }] = await Promise.all([
        (supabase.from('courses') as any).select('teacher_id').eq('id', courseId).single(),
        (supabase.from('profiles') as any).select('role').eq('id', user.id).single(),
    ])
    if (!course) return []
    if ((course as any).teacher_id !== user.id && (profile as any)?.role !== 'admin') return []

    const { data, error } = await supabase
        .from('enrollments')
        .select(`
      *,
      student:profiles!enrollments_student_id_fkey(id, full_name, email, avatar_url)
    `)
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false })

    if (error) return []
    return data || []
}

// ─── Mark Lesson Complete ───

export async function markLessonCompleteAction(
    enrollmentId: string,
    lessonId: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } = {} } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // Verify ownership: only the student who owns the enrollment can mark it as complete
        const { data: enrollment } = await (supabase.from('enrollments') as any).select('student_id').eq('id', enrollmentId).single()
        if (!enrollment || enrollment.student_id !== user.id) {
            return { success: false, error: 'Yetkisiz işlem: bu kaydı güncelleyemezsiniz' }
        }

        const { error } = await (supabase
            .from('lesson_progress') as any)
            .upsert(
                {
                    enrollment_id: enrollmentId,
                    lesson_id: lessonId,
                    is_completed: true,
                    completed_at: new Date().toISOString(),
                },
                { onConflict: 'enrollment_id,lesson_id' }
            )

        if (error) return { success: false, error: error.message }

        // ─── XP REWARD: Lesson Completion ───
        await addXpAction(user.id, 10, 'LESSON_COMPLETED', lessonId)

        // ─── CHECK COURSE COMPLETION ───
        const { data: progress } = await supabase
            .from('enrollment_progress')
            .select('completed_lessons, total_lessons')
            .eq('enrollment_id', enrollmentId)
            .single()

        if (progress && (progress as any).completed_lessons === (progress as any).total_lessons && (progress as any).total_lessons > 0) {
            // Check if already awarded (could use a flag in enrollments, but for now we look at transactions)
            const { count } = await (supabase.from('xp_transactions') as any)
                .select('id', { count: 'exact', head: true })
                .eq('student_id', user.id)
                .eq('reason', 'COURSE_COMPLETED')
                .eq('reference_id', enrollment.course_id)

            if (count === 0) {
                await addXpAction(user.id, 100, 'COURSE_COMPLETED', enrollment.course_id)
                await (supabase.from('student_xp') as any).upsert({ student_id: user.id, xp: 100 }, { onConflict: 'student_id' })
                await (supabase.from('notifications') as any).insert({
                    user_id: user.id,
                    title: 'Kursu Tamamladın! 🏆',
                    message: `Tebrikler! Kursu başarıyla bitirdin ve +100 XP kazandın! 🎉`,
                    type: 'SYSTEM',
                    link: '/student'
                })
            }
        }

        revalidatePath('/student')
        return { success: true, message: 'Ders tamamlandı!' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}

// ─── Update Lesson Video Position ───

export async function updateLessonPositionAction(
    enrollmentId: string,
    lessonId: string,
    positionSeconds: number
): Promise<void> {
    const supabase = await createClient()
    const { data: { user } = {} } = await supabase.auth.getUser()
    if (!user) return

    // Verify ownership
    const { data: enrollment } = await (supabase.from('enrollments') as any).select('student_id').eq('id', enrollmentId).single()
    if (!enrollment || enrollment.student_id !== user.id) return

    await (supabase
        .from('lesson_progress') as any)
        .upsert(
            {
                enrollment_id: enrollmentId,
                lesson_id: lessonId,
                last_position_seconds: positionSeconds,
            },
            { onConflict: 'enrollment_id,lesson_id' }
        )
}

// ─── Get Lesson Progress ───

export async function getLessonProgress(enrollmentId: string) {
    const supabase = await createClient()
    const { data: { user } = {} } = await supabase.auth.getUser()
    if (!user) return []

    // Verify auth: student themselves, teacher of the course, or admin
    const { data: enrollment } = await (supabase.from('enrollments') as any).select('student_id, course_id').eq('id', enrollmentId).single()
    if (!enrollment) return []

    if (enrollment.student_id !== user.id) {
        const [{ data: course }, { data: profile }] = await Promise.all([
            (supabase.from('courses') as any).select('teacher_id').eq('id', enrollment.course_id).single(),
            (supabase.from('profiles') as any).select('role').eq('id', user.id).single(),
        ])
        if ((course as any)?.teacher_id !== user.id && (profile as any)?.role !== 'admin') return []
    }

    const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollmentId)

    if (error) return []
    return data || []
}

// ─── Admin: Drop Student Enrollment ───

export async function adminDropEnrollmentAction(studentId: string, courseId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } = {} } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        // Check ADMIN status
        const { data: profile } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
        if ((profile as any)?.role !== 'admin') {
            return { success: false, error: 'Yetkisiz işlem: sadece yöneticiler kayıt silebilir' }
        }

        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('student_id', studentId)
            .eq('course_id', courseId)

        if (error) return { success: false, error: error.message }

        revalidatePath('/admin')
        return { success: true, message: 'Öğrenci kurstan çıkarıldı.' }
    } catch {
        return { success: false, error: 'Bir hata oluştu.' }
    }
}
// ─── Enroll In Group ───

export async function enrollInGroupAction(groupId: string, studentId?: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } = {} } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        const targetStudentId = studentId || user.id

        // Check if already enrolled
        const { data: existing } = await supabase
            .from('group_enrollments')
            .select('id, status')
            .eq('student_id', targetStudentId)
            .eq('group_id', groupId)
            .single()

        if (existing && (existing as any).status === 'active') {
            return { success: false, error: 'Bu gruba zaten kayıtlısınız' }
        }

        if (existing) {
            await (supabase
                .from('group_enrollments') as any)
                .update({ status: 'active', enrolled_at: new Date().toISOString() })
                .eq('id', (existing as any).id)
        } else {
            const { error } = await (supabase
                .from('group_enrollments') as any)
                .insert({
                    student_id: targetStudentId,
                    group_id: groupId,
                    status: 'active',
                })
            if (error) throw error
        }

        // Notify Student
        const { data: groupData } = await (supabase.from('groups').select('title').eq('id', groupId).single() as any)
        await (supabase.from('notifications') as any).insert({
            user_id: targetStudentId,
            title: 'Grup Kaydı Başarılı',
            message: `"${groupData?.title || 'Gruba'}" başarıyla kaydoldunuz.`,
            link: '/student/my-lessons',
            type: 'ENROLLMENT'
        })

        revalidatePath('/student/my-lessons')
        revalidatePath('/student/schedule')
        return { success: true, message: 'Gruba başarıyla kaydoldunuz!' }
    } catch (err: any) {
        console.error('Enroll in group error:', err)
        return { success: false, error: err.message || 'Bir hata oluştu.' }
    }
}

// ─── Update Lesson Balance ───

export async function updateLessonBalanceAction(teacherId: string, lessonCount: number, studentId?: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { data: { user } = {} } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        const targetStudentId = studentId || user.id
        const lessonsToAdd = lessonCount;

        // 1. Resolve internal teacher ID if User ID was provided
        let tid = teacherId;
        const { data: teacherRecord } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', teacherId) // If teacherId is User ID
            .maybeSingle();

        if (teacherRecord) {
            tid = (teacherRecord as any).id;
        }

        // 2. Get existing balance
        const { data: balance, error: fetchError } = await supabase
            .from('student_lesson_balance')
            .select('*')
            .eq('student_id', targetStudentId)
            .eq('teacher_id', tid)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError
        // Update existing balance
        if (balance) {
            const { error } = await (supabase
                .from('student_lesson_balance') as any)
                .update({
                    lessons_remaining: (balance as any).lessons_remaining + lessonsToAdd,
                    lessons_total: (balance as any).lessons_total + lessonsToAdd,
                    updated_at: new Date().toISOString()
                })
                .eq('id', (balance as any).id)
            if (error) throw error
        } else {
            const { error: insertError } = await (supabase
                .from('student_lesson_balance') as any)
                .insert({
                    student_id: targetStudentId,
                    teacher_id: tid,
                    lessons_remaining: lessonsToAdd,
                    lessons_total: lessonsToAdd,
                })
            if (insertError) throw insertError
        }

        revalidatePath('/student/my-lessons')
        return { success: true, message: 'Ders bakiyesi güncellendi!' }
    } catch (err: any) {
        console.error('Update balance error:', err)
        return { success: false, error: err.message || 'Bir hata oluştu.' }
    }
}

// ─── Fulfill Purchase ───

export async function fulfillPurchaseAction(transactionId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // 1. Get Transaction with Metadata
        const { data: transaction, error: fetchError } = await (supabase
            .from('transactions') as any)
            .select('*')
            .eq('id', transactionId)
            .single()

        if (fetchError || !transaction) {
            return { success: false, error: 'İşlem bulunamadı.' }
        }

        if (transaction.status !== 'COMPLETED') {
            return { success: false, error: 'İşlem henüz tamamlanmadı.' }
        }

        const metadata = transaction.metadata as any
        const type = metadata?.type || 'course'
        const targetId = metadata?.targetId || transaction.course_id
        const studentId = transaction.user_id

        if (!targetId) {
            return { success: false, error: 'Hedef ürün bulunamadı.' }
        }

        // 2. Fulfill based on Type
        switch (type) {
            case 'course':
                return await enrollStudentAction(targetId)

            case 'package':
                const lessons = metadata?.lessons || 0
                if (!lessons) return { success: false, error: 'Ders sayısı belirtilmemiş.' }
                return await updateLessonBalanceAction(targetId, lessons, studentId)

            case 'group':
                return await enrollInGroupAction(targetId, studentId)

            default:
                return { success: false, error: 'Geçersiz ürün tipi.' }
        }

    } catch (err: any) {
        console.error('Fulfillment error:', err)
        return { success: false, error: 'Satın alma işlemi tamamlanırken bir hata oluştu.' }
    }
}

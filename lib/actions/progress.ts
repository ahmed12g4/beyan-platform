'use server'

import { createClient } from '@/lib/supabase/server'

export async function getCourseProgressAction(courseId: string) {
    const supabase = await createClient();
    
    try {
        // 1. Get all enrollments for this course with profile info
        // Note: Using any for join as names can vary
        const { data: enrollments, error: enrollError } = await (supabase
            .from('enrollments') as any)
            .select(`
                id,
                student_id,
                profiles:student_id (full_name, avatar_url)
            `)
            .eq('course_id', courseId);
        
        if (enrollError) throw enrollError;
        if (!enrollments || enrollments.length === 0) return [];

        // 2. Get all progress for these enrollments
        const enrollmentIds = enrollments.map((e: any) => e.id);
        const { data: progress, error: progressError } = await (supabase
            .from('lesson_progress') as any)
            .select('enrollment_id, lesson_id, is_completed')
            .in('enrollment_id', enrollmentIds)
            .eq('is_completed', true);
        
        if (progressError) throw progressError;
        
        // 3. Get Quiz Results for these students
        const studentIds = enrollments.map((e: any) => e.student_id);
        const { data: quizResults } = await (supabase
            .from('quiz_results') as any)
            .select(`
                student_id,
                quiz_id,
                score,
                passed,
                created_at,
                quizzes:quiz_id (title)
            `)
            .in('student_id', studentIds);

        // 4. Map progress to enrollments
        return enrollments.map((enroll: any) => ({
            ...enroll,
            completed_lessons: progress?.filter((p: any) => p.enrollment_id === enroll.id).map((p: any) => p.lesson_id) || [],
            quiz_results: quizResults?.filter((qr: any) => qr.student_id === enroll.student_id) || []
        }));
    } catch (error) {
        console.error("Get course progress error:", error);
        return [];
    }
}

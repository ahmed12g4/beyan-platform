'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createQuizAction(quizData: any, questions: any[]) {
    const supabase = await createClient();
    
    try {
        const { data: quiz, error: quizError } = await (supabase
            .from('quizzes') as any)
            .insert(quizData)
            .select()
            .single();
        
        if (quizError) throw quizError;

        const questionsToInsert = questions.map(q => ({
            ...q,
            quiz_id: quiz.id
        }));

        const { error: qError } = await (supabase
            .from('quiz_questions') as any)
            .insert(questionsToInsert);
        
        if (qError) throw qError;

        revalidatePath('/teacher/quizzes');
        return { success: true, quizId: quiz.id };
    } catch (error: any) {
        console.error("Create quiz error:", error);
        return { success: false, error: error.message };
    }
}

export async function getQuizAction(quizId: string) {
    const supabase = await createClient();
    
    try {
        const { data: quiz, error: quizError } = await (supabase
            .from('quizzes') as any)
            .select(`
                *,
                questions:quiz_questions(*)
            `)
            .eq('id', quizId)
            .single();
        
        if (quizError) throw quizError;
        return { success: true, data: quiz };
    } catch (error: any) {
        console.error("Get quiz error:", error);
        return { success: false, error: error.message };
    }
}

export async function submitQuizAction(quizId: string, studentId: string, answers: (number | null)[]) {
    const supabase = await createClient();

    try {
        // 1. Get correct answers
        const { data: questions, error: qError } = await (supabase
            .from('quiz_questions') as any)
            .select('id, correct_option_index')
            .eq('quiz_id', quizId)
            .order('created_at', { ascending: true });
        
        if (qError) throw qError;

        // 2. Calculate score
        let correctCount = 0;
        questions.forEach((q: any, index: number) => {
            if (answers[index] === q.correct_option_index) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / questions.length) * 100);

        // 3. Get passing score and related course/lesson info
        const { data: quiz } = await (supabase
            .from('quizzes')
            .select('min_passing_score, lesson_id, course_id')
            .eq('id', quizId) as any)
            .single();
        
        const passed = score >= (quiz?.min_passing_score || 50);

        // 4. Save result
        const { error: resError } = await (supabase
            .from('quiz_results') as any)
            .insert({
                student_id: studentId,
                quiz_id: quizId,
                score,
                passed
            });
        
        if (resError) throw resError;

        // 5. If passed, mark lesson as completed
        if (passed && quiz?.lesson_id && quiz?.course_id) {
            const { data: enrollment } = await (supabase
                .from('enrollments')
                .select('id')
                .eq('student_id', studentId)
                .eq('course_id', quiz.course_id) as any)
                .single();
            
            if (enrollment) {
                await (supabase
                    .from('lesson_progress') as any)
                    .upsert({
                        enrollment_id: enrollment.id,
                        lesson_id: quiz.lesson_id,
                        is_completed: true,
                        completed_at: new Date().toISOString()
                    }, { onConflict: 'enrollment_id,lesson_id' });
            }
        }

        revalidatePath('/student/quizzes');
        return { success: true, score, passed };
    } catch (error: any) {
        console.error("Submit quiz error:", error);
        return { success: false, error: error.message };
    }
}

export async function getCourseQuizzesAction(courseId: string) {
    const supabase = await createClient();
    
    const { data, error } = await (supabase
        .from('quizzes') as any)
        .select('*')
        .eq('course_id', courseId);
    
    if (error) return [];
    return data;
}

export async function deleteQuizAction(quizId: string) {
    const supabase = await createClient();
    
    try {
        const { error } = await (supabase
            .from('quizzes') as any)
            .delete()
            .eq('id', quizId);
        
        if (error) throw error;
        
        revalidatePath('/teacher/quizzes');
        return { success: true };
    } catch (error: any) {
        console.error("Delete quiz error:", error);
        return { success: false, error: error.message };
    }
}

export async function getQuizResultsAction(quizId: string) {
    const supabase = await createClient();
    
    try {
        const { data, error } = await (supabase
            .from('quiz_results') as any)
            .select(`
                *,
                profiles:student_id(full_name, avatar_url)
            `)
            .eq('quiz_id', quizId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error("Get quiz results error:", error);
        return { success: false, error: error.message };
    }
}

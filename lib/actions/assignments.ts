'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAssignmentAction(formData: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const course_id = formData.course_id && formData.course_id !== "" ? formData.course_id : null;
    const group_id = formData.group_id && formData.group_id !== "" ? formData.group_id : null;

    const { error } = await (supabase.from('assignments') as any).insert({
        title: formData.title,
        description: formData.description,
        file_url: formData.file_url,
        course_id,
        group_id,
        teacher_id: user.id,
        due_date: formData.due_date && formData.due_date !== "" ? formData.due_date : null
    });

    if (error) {
        console.error("Create assignment error:", error);
        return { success: false, error: "Failed to create assignment" };
    }

    revalidatePath('/teacher/assignments');
    revalidatePath('/teacher/courses');
    revalidatePath('/teacher/groups');
    return { success: true };
}

export async function getAssignmentsAction(filters: { course_id?: string, group_id?: string }) {
    const supabase = await createClient();
    
    let query = supabase.from('assignments').select('*');
    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.group_id) query = query.eq('group_id', filters.group_id);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) return [];
    return data;
}

export async function submitAssignmentAction(submission: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await (supabase.from('assignment_submissions') as any).insert({
        assignment_id: submission.assignment_id,
        student_id: user.id,
        file_url: submission.file_url,
        student_notes: submission.student_notes
    });

    if (error) {
        console.error("Submit assignment error:", error);
        return { success: false, error: "Failed to submit assignment" };
    }

    revalidatePath('/student/assignments');
    return { success: true };
}

export async function gradeAssignmentAction(submissionId: string, gradeData: { grade: string, feedback: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await (supabase.from('assignment_submissions') as any)
        .update({
            grade: gradeData.grade,
            teacher_feedback: gradeData.feedback,
            status: 'GRADED'
        })
        .eq('id', submissionId);

    if (error) {
        console.error("Grade assignment error:", error);
        return { success: false, error: "Failed to grade assignment" };
    }

    return { success: true };
}

export async function getSubmissionsAction(assignmentId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*, profiles!student_id(full_name, avatar_url)')
        .eq('assignment_id', assignmentId);
    
    if (error) return [];
    return data;
}

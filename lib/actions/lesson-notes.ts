'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveStudentNoteAction(lessonId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        const { error } = await (supabase.from('lesson_notes' as any) as any).upsert({
            student_id: user.id,
            lesson_id: lessonId,
            content: content,
            updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,lesson_id' });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Save note error:", error);
        return { success: false, error: "Failed to save note" };
    }
}

export async function getStudentNoteAction(lessonId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return '';

    try {
        const { data, error } = await (supabase.from('lesson_notes' as any) as any)
            .select('content')
            .eq('student_id', user.id)
            .eq('lesson_id', lessonId)
            .maybeSingle();
        
        if (error) throw error;
        return data?.content || '';
    } catch (error) {
        console.error("Get note error:", error);
        return '';
    }
}

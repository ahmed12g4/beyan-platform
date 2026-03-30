
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'No user' }), { status: 401 })

    const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
            *,
            courses (*)
        `)
        .eq('student_id', user.id)

    return new Response(JSON.stringify({ enrollments, error, userId: user.id }), { status: 200 })
}

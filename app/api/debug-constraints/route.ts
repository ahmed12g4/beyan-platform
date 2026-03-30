
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createAdminClient()
        // Query to find check constraint definitions
        const { data, error } = await supabase.rpc('get_lessons_constraints')
        
        // Manual query for constraints
        const { data: constraints, error: cError } = await supabase
            .from('lessons')
            .select('lesson_type')
            .limit(10)

        const { data: meta } = await supabase.from('pg_constraint' as any).select('*').eq('conname', 'lessons_lesson_type_check')

        return new Response(JSON.stringify({ 
            constraints,
            meta,
            error: cError
        }), { status: 200 })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
}

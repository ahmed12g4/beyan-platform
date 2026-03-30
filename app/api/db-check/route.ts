
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()
    
    const cid = 'ea1b3bb2-6d8d-41ae-9d8e-b056524a3d1f'
    const { data: course } = await supabase.from('courses').select('*, profiles!teacher_id(full_name)').eq('id', cid).single()
    const { data: content } = await supabase.from('course_content').select('*').eq('course_id', cid)

    return new Response(JSON.stringify({ 
        course,
        contentCount: content?.length,
        content
    }), { status: 200 })
}
